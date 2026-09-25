import type { EnforcementRecord,SourceDefinition } from "../types";
import { reviewStatus,stableId } from "../normalize";

export const MONTHLY_PDF_VERSION="monthly-pdf-v1.0.0";
const digits=(value:string)=>value.replace(/[０-９]/g,char=>String.fromCharCode(char.charCodeAt(0)-0xFEE0));
const compact=(value:string)=>digits(value).replace(/[ \t　]+/g," ").trim();
export function parseMonthlyPdf(text:string,source:SourceDefinition,pdfUrl:string,year=new Date().getFullYear()):EnforcementRecord[]{
  let date:string|null=null;const records:EnforcementRecord[]=[];
  for(const raw of text.split(/\r?\n/)){
    const line=compact(raw);const heading=line.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if(heading){date=`${year}-${heading[1].padStart(2,"0")}-${heading[2].padStart(2,"0")}`;continue;}
    if(!date||!/^[0-9]+\s/.test(line))continue;
    const routeMatch=line.match(/(国\s*道\s*\d+\s*号|県道|市道|町道|村道)/);if(!routeMatch||routeMatch.index===undefined)continue;
    const before=line.slice(0,routeMatch.index).replace(/^[0-9]+\s*/,"").trim(),route=routeMatch[1].replace(/\s/g,""),after=line.slice(routeMatch.index+routeMatch[0].length).trim();
    const location=after.replace(/[（(].*$/,"").replace(/\s*\d+箇所.*$/,"").trim()||null;if(!before||!location)continue;
    const category="交通指導・取締り",review=reviewStatus({date,category});records.push({id:stableId([source.id,date,before,route,location]),prefecture:source.prefecture,date,timeLabel:null,startTime:null,endTime:null,location,route,category,policeStation:before,latitude:null,longitude:null,locationPrecision:"approximate",sourceUrl:pdfUrl,sourceTitle:source.title,...review,rawText:line});
  }
  return records;
}
