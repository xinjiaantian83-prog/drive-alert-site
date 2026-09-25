import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {fetchOfficial} from "../lib/fetcher";
import {extractPdfText} from "../lib/adapters/ehime";
import {assessPriorityPdfText,extractStationPages,extractStationPdfs} from "../lib/crawlers/two-step-pdf";

const targets=[
  {prefecture:"静岡",url:"https://www.pref.shizuoka.jp/police/anzen/sokudosisin/keisatusho-sisin.html"},
  {prefecture:"京都",url:"https://www.pref.kyoto.jp/fukei/kotsu/sokudo/torisimari/index2.html"}
];
async function main(){const results=[];
for(const target of targets){
  const index=await fetchOfficial(target.url),pages=extractStationPages(index.text,target.url),documents=[];
  for(const page of pages){try{const html=await fetchOfficial(page.pageUrl);for(const document of extractStationPdfs(html.text,page)){try{const pdf=await fetchOfficial(document.pdfUrl),text=await extractPdfText(pdf.bytes);documents.push({...document,sha256:pdf.hash,...assessPriorityPdfText(text)});}catch(error){documents.push({...document,error:error instanceof Error?error.message:String(error)});}}}catch(error){documents.push({...page,error:error instanceof Error?error.message:String(error)});}}
  results.push({...target,indexSha256:index.hash,stationPageCount:pages.length,pdfCount:documents.filter(item=>"pdfUrl" in item).length,safePdfCount:documents.filter(item=>"safeForAutomaticImport" in item&&item.safeForAutomaticImport).length,documents});
}
const output=join(process.cwd(),"data","two-step-pdf-audit.json");mkdirSync(join(process.cwd(),"data"),{recursive:true});writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results.map(({prefecture,stationPageCount,pdfCount,safePdfCount})=>({prefecture,stationPageCount,pdfCount,safePdfCount})),null,2));console.log(output);}
main().catch(error=>{console.error(error);process.exitCode=1;});
