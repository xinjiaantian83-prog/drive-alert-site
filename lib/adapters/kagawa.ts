import * as cheerio from "cheerio";
import type { EnforcementRecord, SourceDefinition } from "../types";
import { reviewStatus, stableId } from "../normalize";

export const KAGAWA_PARSER_VERSION = "kagawa-html-v1.0.0";
export function parseKagawaIndex(html:string, baseUrl:string) {
  const $=cheerio.load(html); const urls:string[]=[];
  $("#tmp_contents a[href]").each((_,a)=>{const label=$(a).text().trim(); if (/\d{1,2}月\d{1,2}日/.test(label)) urls.push(new URL($(a).attr("href")!,baseUrl).href);});
  return [...new Set(urls)];
}
export function parseKagawaDetail(html:string, source:SourceDefinition, url:string, year=new Date().getFullYear()):EnforcementRecord[]{
  const $=cheerio.load(html); const root=$("#tmp_contents"); const heading=root.find("h2").first().text();
  const md=heading.match(/(\d{1,2})月(\d{1,2})日/); if(!md) return [];
  const date=`${year}-${md[1].padStart(2,"0")}-${md[2].padStart(2,"0")}`;
  const text=root.find("p").map((_,p)=>$(p).text().replace(/\s+/g," ").trim()).get().join("\n");
  const matches=[...text.matchAll(/○(朝|昼間|夜間)は、([^\n]+?)警察署管内において、\n?([\s\S]*?)を重点に\n?交通指導取締りが行われます。/g)];
  const out:EnforcementRecord[]=[];
  for(const m of matches){const time=m[1]; const stations=m[2].split("・").map(s=>s.replace(/警察署$/,"")); const category=m[3].replace(/\n/g," ").replace(/\s+/g," ").trim();
    for(const stationName of stations){const policeStation=`${stationName}警察署`; const location=`${policeStation}管内`; const review=reviewStatus({date,category});
      out.push({id:stableId([source.id,date,time,policeStation,category]),prefecture:"香川",date,timeLabel:time,startTime:null,endTime:null,location,route:null,category,policeStation,latitude:null,longitude:null,locationPrecision:"area_only",sourceUrl:url,sourceTitle:source.title,...review,rawText:m[0]});}
  } return out;
}
