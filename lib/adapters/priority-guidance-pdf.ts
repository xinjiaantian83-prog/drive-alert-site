import type {EnforcementRecord,SourceDefinition} from "../types";
import {stableId} from "../normalize";

export const PRIORITY_GUIDANCE_PDF_VERSION="priority-guidance-pdf-v1.0.1";
const ascii=(value:string)=>value.replace(/[０-９]/g,char=>String.fromCharCode(char.charCodeAt(0)-0xFEE0)).replace(/[～〜]/g,"～");
const tidy=(value:string)=>ascii(value).replace(/[ \t　]+/g," ").trim();
function lastDay(year:number,month:number){return new Date(Date.UTC(year,month,0)).getUTCDate();}
function validity(text:string){
  const range=ascii(text).match(/令和\s*(\d+)年\s*(\d{1,2})月\s*～\s*(\d{1,2})月/);if(!range)return {activeFrom:null,activeTo:null};
  const year=2018+Number(range[1]),from=Number(range[2]),to=Number(range[3]);
  return {activeFrom:`${year}-${String(from).padStart(2,"0")}-01T00:00:00+09:00`,activeTo:`${year}-${String(to).padStart(2,"0")}-${String(lastDay(year,to)).padStart(2,"0")}T23:59:00+09:00`};
}
function routeNames(value:string){const denied=/^(交通|路線|以外の路線|である路線|その他の路線)$/;return [...value.matchAll(/(国道\s*\d+\s*号|府道\s*\d+\s*号|県道\s*\d+\s*号|[一-龠ぁ-んァ-ヶーA-Za-z0-9]{2,}(?:通|線))/g)].map(match=>tidy(match[1]).replace(/\s/g,"")).filter(route=>!denied.test(route));}
export function parsePriorityGuidancePdf(text:string,source:SourceDefinition,pdfUrl:string):EnforcementRecord[]{
  const normalized=ascii(text),lines=normalized.split(/\r?\n/).map(tidy).filter(Boolean),station=(normalized.match(/([^\n]{1,20}?警察署)/)?.[1].replace(/[ \t　]/g,"").replace(/^[^一-龠ぁ-んァ-ヶー]+/,"")||null),period=validity(normalized),candidates:Array<{route:string|null;location:string|null;time:string|null;raw:string}>=[];
  const firstHeading=lines.findIndex(line=>line.includes("重点路線・重点地区"));if(firstHeading>=0){for(const line of lines.slice(firstHeading+1)){if(line.startsWith("※")||line.includes("取締り方針"))break;const value=line.replace(/^\d+\s*/,"");if(value.includes("重点路線・重点地区"))continue;const routes=routeNames(value);if(routes.length)for(const route of routes)candidates.push({route,location:null,time:null,raw:line});else if(/地区|区域|管内|市内|町内/.test(value)&&value.length<=40)candidates.push({route:null,location:value,time:null,raw:line});}}
  for(const line of lines){if(!/重点路線/.test(line)||!/(重点時間帯|昼間帯|夜間帯|時間帯)/.test(line))continue;const routePart=line.split(/重点路線[^\p{L}\p{N}]*/u)[1]?.split(/[/／]|重点時間帯/)[0]??"";const time=line.match(/重点時間帯[^\p{L}\p{N}]*(.+)$/u)?.[1]??null;for(const route of routeNames(routePart))candidates.push({route,location:null,time:tidy(time??"")||null,raw:line});}
  const unique=new Map<string,{route:string|null;location:string|null;time:string|null;raw:string}>();for(const item of candidates)unique.set(`${item.route}|${item.location}|${item.time}`,item);
  if(!station)return [];
  return [...unique.values()].map(item=>{const category=/速度取締|速度超過/.test(normalized)?"速度違反":"交通指導取締り";const hasPeriod=Boolean(period.activeFrom&&period.activeTo);return {id:stableId([source.id,station,item.route,item.location,item.time,period.activeFrom,period.activeTo]),prefecture:source.prefecture,date:null,timeLabel:item.time,startTime:null,endTime:null,location:item.location,route:item.route,category,policeStation:station,latitude:null,longitude:null,locationPrecision:"area_only",activeFrom:period.activeFrom,activeTo:period.activeTo,sourceUrl:pdfUrl,sourceTitle:source.title,status:hasPeriod?"confirmed":"needs_review",reviewReason:hasPeriod?null:"有効期間を特定できません",rawText:item.raw};});
}
