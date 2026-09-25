import * as cheerio from "cheerio";

export type StationPage={stationName:string;pageUrl:string};
export type StationPdf=StationPage&{pdfUrl:string};
const clean=(value:string)=>value.replace(/[\s　]+/g," ").trim();
const uniqueBy=<T>(items:T[],key:(item:T)=>string)=>[...new Map(items.map(item=>[key(item),item])).values()];
export function extractStationPages(html:string,baseUrl:string):StationPage[]{
  const $=cheerio.load(html),items:StationPage[]=[];
  $("a[href]").each((_,node)=>{const stationName=clean($(node).text()),href=$(node).attr("href");if(!href||!/警察署$/.test(stationName))return;const pageUrl=new URL(href,baseUrl).href;if(!/^https:\/\//.test(pageUrl))return;items.push({stationName,pageUrl});});
  return uniqueBy(items,item=>item.pageUrl);
}
export function extractStationPdfs(html:string,page:StationPage):StationPdf[]{
  const $=cheerio.load(html),items:StationPdf[]=[];
  $("a[href]").each((_,node)=>{const href=$(node).attr("href"),label=clean($(node).text());if(!href||!/(\.pdf)(?:$|[?#])/i.test(href)||!/(速度|取締|指針)/.test(label))return;items.push({...page,pdfUrl:new URL(href,page.pageUrl).href});});
  return uniqueBy(items,item=>item.pdfUrl);
}
export function assessPriorityPdfText(text:string){
  const station=Boolean(text.match(/[^\n]{1,20}警察署/)),route=Boolean(text.match(/国道\s*[０-９0-9]+\s*号|(?:府道|県道)|[^\s]{2,}(?:通|線)/)),area=Boolean(text.match(/(?:地区|区域|区間|交差点付近|から.+まで)/)),time=Boolean(text.match(/[０-９0-9]{1,2}[:：時～〜][０-９0-9]{0,2}|朝|昼間|夜間|終日/)),validity=Boolean(text.match(/令和\s*[０-９0-9]+年\s*[０-９0-9]+月\s*[～〜-]\s*[０-９0-9]+月/));
  return {station,route,area,time,validity,safeForAutomaticImport:station&&route&&area&&validity};
}
