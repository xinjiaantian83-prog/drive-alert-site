import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {sourceCatalog} from "../lib/source-catalog";
import {fetchOfficial} from "../lib/fetcher";
import {extractPdfText} from "../lib/adapters/ehime";
import {detectPdfLayout,detectUnknownPdfSubtype,type PdfLayout,type UnknownPdfSubtype} from "../lib/adapters/pdf-layout-detector";
import {crawlOfficialPdfs} from "../lib/crawlers/official-pdf-crawler";

type DocumentResult={url:string;sha256?:string;layout?:PdfLayout;subtype?:UnknownPdfSubtype;discoveredFrom?:string;depth?:number;error?:string};
type AuditResult={prefecture:string;url:string|null;pdfCount?:number;documents?:DocumentResult[];error?:string};
async function main(){
  const targets=sourceCatalog.filter(item=>item.status!=="active"&&(item.discoveryPattern==="document_index"||item.discoveryPattern==="direct_document")),results:AuditResult[]=[];
  for(const target of targets){try{const found=(await crawlOfficialPdfs(target.officialUrl!,async url=>{const file=await fetchOfficial(url);return{text:file.text,contentType:file.contentType??undefined};})).slice(0,4),documents:DocumentResult[]=[];for(const item of found){try{const file=await fetchOfficial(item.pdfUrl),text=await extractPdfText(file.bytes),layout=detectPdfLayout(text);documents.push({url:item.pdfUrl,sha256:file.hash,layout,subtype:layout==="unknown"?detectUnknownPdfSubtype(text):undefined,discoveredFrom:item.discoveredFrom,depth:item.depth});}catch(error){documents.push({url:item.pdfUrl,discoveredFrom:item.discoveredFrom,depth:item.depth,error:error instanceof Error?error.message:String(error)});}}results.push({prefecture:target.prefecture,url:target.officialUrl,pdfCount:found.length,documents});}catch(error){results.push({prefecture:target.prefecture,url:target.officialUrl,error:error instanceof Error?error.message:String(error)});}}
  const output=join(process.cwd(),"data","pdf-layout-audit.json");mkdirSync(join(process.cwd(),"data"),{recursive:true});writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));
  console.log(JSON.stringify(results.map(item=>({prefecture:item.prefecture,documents:item.documents?.map(document=>({layout:document.layout??"error",subtype:document.subtype??null,depth:document.depth??null}))??[],error:item.error??null})),null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
