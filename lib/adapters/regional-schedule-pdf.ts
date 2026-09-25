import type {EnforcementRecord,SourceDefinition} from "../types";
import {stableId} from "../normalize";

export const REGIONAL_SCHEDULE_PDF_VERSION="regional-schedule-pdf-v1.0.0";
const ascii=(value:string)=>value.replace(/[０-９]/g,char=>String.fromCharCode(char.charCodeAt(0)-0xFEE0)).replace(/[　\t ]+/g,"");
export function parseRegionalSchedulePdf(text:string,source:SourceDefinition,pdfUrl:string,year=new Date().getFullYear()):EnforcementRecord[]{
  const normalized=ascii(text),month=Number(normalized.match(/(\d{1,2})月の取締り重点/)?.[1]);if(!month||!source.regionLabels?.length)return [];
  const regions=[...source.regionLabels].sort((a,b)=>b.length-a.length),records:EnforcementRecord[]=[];let date:string|null=null;
  for(const raw of normalized.split(/\r?\n/)){const line=raw.trim();const day=line.match(/^(\d{1,2})(?:日)?[月火水木金土日]$/);if(day){date=`${year}-${String(month).padStart(2,"0")}-${day[1].padStart(2,"0")}`;continue;}if(!date)continue;const region=regions.find(value=>line.startsWith(value));if(!region)continue;const body=line.slice(region.length),categoryMatch=body.match(/(交差点関連|速度|飲酒)$/);if(!categoryMatch)continue;const route=body.slice(0,-categoryMatch[1].length);if(!route||route.length<2)continue;const category=categoryMatch[1]==="速度"?"速度違反":categoryMatch[1]==="飲酒"?"飲酒運転":"交差点関連違反";records.push({id:stableId([source.id,date,region,route,category]),prefecture:source.prefecture,date,timeLabel:null,startTime:null,endTime:null,location:`${region}地域`,route,category,policeStation:null,latitude:null,longitude:null,locationPrecision:"area_only",sourceUrl:pdfUrl,sourceTitle:source.title,status:"confirmed",reviewReason:null,rawText:line});
  }return records;
}
