import * as cheerio from "cheerio";

export type CrawledPdf={pdfUrl:string;discoveredFrom:string;depth:number;linkLabel:string};
type FetchHtml=(url:string)=>Promise<{text:string;contentType?:string}>;
const TOPIC=/(交通.{0,8}(?:取締|指導)|取締.{0,8}(?:計画|情報|重点|指針)|速度.{0,8}取締|公開.{0,8}取締)/;
const EXCLUDE=/(採用|入札|広報紙|統計|事故統計|免許|申請|様式|パンフレット)/;
const clean=(value:string)=>value.replace(/[\s　]+/g," ").trim();
const sameOrigin=(url:string,origin:string)=>{try{return new URL(url).origin===origin;}catch{return false;}};

/** Official-origin only, topic-constrained crawler. The entry page is depth 0. */
export async function crawlOfficialPdfs(entryUrl:string,fetchHtml:FetchHtml,maxDepth=2):Promise<CrawledPdf[]>{
  const origin=new URL(entryUrl).origin,queue=[{url:entryUrl,depth:0}],visited=new Set<string>(),pdfs:CrawledPdf[]=[];
  while(queue.length){const current=queue.shift()!;if(visited.has(current.url)||current.depth>maxDepth)continue;visited.add(current.url);let page:{text:string;contentType?:string};try{page=await fetchHtml(current.url);}catch{continue;}if(/pdf/i.test(page.contentType??"")){pdfs.push({pdfUrl:current.url,discoveredFrom:current.url,depth:current.depth,linkLabel:"direct PDF"});continue;}const $=cheerio.load(page.text);
    $("a[href]").each((_,node)=>{const href=$(node).attr("href"),label=clean($(node).text()),context=clean($(node).closest("li, p, td, div").text());if(!href)return;let url:string;try{url=new URL(href,current.url).href;}catch{return;}if(!sameOrigin(url,origin)||EXCLUDE.test(label+context))return;const isPdf=/\.pdf(?:$|[?#])/i.test(url);if(isPdf){if(TOPIC.test(label+context+url))pdfs.push({pdfUrl:url,discoveredFrom:current.url,depth:current.depth+1,linkLabel:label});return;}if(current.depth<maxDepth&&TOPIC.test(label+context))queue.push({url,depth:current.depth+1});});
  }
  return [...new Map(pdfs.map(item=>[item.pdfUrl,item])).values()];
}
