import type { PdfItem } from "./kochi";
import type { EnforcementRecord, SourceDefinition } from "../types";
import { reviewStatus, stableId } from "../normalize";

export const COORDINATE_SCHEDULE_PDF_VERSION = "coordinate-schedule-pdf-v1.0.0";
const digits=(value:string)=>value.replace(/[０-９]/g,char=>String.fromCharCode(char.charCodeAt(0)-0xfee0));
const clean=(value:string)=>digits(value).replace(/[ \t　]+/g," ").trim();
const iso=(year:number,month:number,day:number)=>`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

function record(source:SourceDefinition,pdfUrl:string,date:string,timeLabel:string,location:string,category:string,rawText:string):EnforcementRecord {
  const review=reviewStatus({date,category});
  return {id:stableId([source.id,date,timeLabel,location,category]),prefecture:source.prefecture,date,timeLabel,startTime:null,endTime:null,location,route:null,category,policeStation:null,latitude:null,longitude:null,locationPrecision:"area_only",activeFrom:`${date}T00:00:00+09:00`,activeTo:`${date}T23:59:59+09:00`,notificationEligible:false,sourceUrl:pdfUrl,sourceTitle:source.title,...review,rawText};
}

function bands(items:PdfItem[],layout:"chiba"|"saitama"){
  const dates=items.filter(item=>item.transform[4]<100).map(item=>({item,match:clean(item.str).match(/^(\d{1,2})月(\d{1,2})日$/)})).filter((value):value is {item:PdfItem;match:RegExpMatchArray}=>Boolean(value.match)).map(({item,match})=>({month:Number(match[1]),day:Number(match[2]),y:item.transform[5]})).sort((a,b)=>b.y-a.y);
  return dates.map((date,index)=>{const previousGap=index>0?dates[index-1].y-date.y:dates[1]?date.y-dates[1].y:80;const nextGap=index<dates.length-1?date.y-dates[index+1].y:previousGap;const upperRatio=layout==="chiba"?(index===0?.55:.42):.55;const lowerRatio=layout==="chiba"?.58:.5;return {date,upper:date.y+previousGap*upperRatio,lower:date.y-nextGap*lowerRatio};});
}

function chiba(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,year:number){
  const items=pages[0]??[],out:EnforcementRecord[]=[];
  for(const band of bands(items,"chiba")){
    const inBand=items.filter(item=>item.transform[5]<band.upper&&item.transform[5]>=band.lower);
    for(const side of [{label:"昼間",categoryX:98,locationMin:120,locationMax:270},{label:"夜間",categoryX:276,locationMin:300,locationMax:1000}]){
      const categories=inBand.filter(item=>Math.abs(item.transform[4]-side.categoryX)<8&&/^(速度違反|交差点違反|通行禁止|飲酒|あおり運転|自転車)$/.test(clean(item.str)));
      const locations=inBand.filter(item=>item.transform[4]>=side.locationMin&&item.transform[4]<side.locationMax&&clean(item.str)&&!/[()（）]から|まで/.test(clean(item.str)));
      const grouped=new Map<PdfItem,string[]>();
      for(const location of locations){const nearest=[...categories].sort((a,b)=>Math.abs(a.transform[5]-location.transform[5])-Math.abs(b.transform[5]-location.transform[5]))[0];if(nearest&&Math.abs(nearest.transform[5]-location.transform[5])<20){const values=grouped.get(nearest)??[];values.push(clean(location.str));grouped.set(nearest,values);}}
      for(const [categoryItem,lines] of grouped){const category=clean(categoryItem.str);const joined=lines.join("").replace(/、$/g,"");for(const location of joined.split("、").map(clean).filter(Boolean)){const date=iso(year,band.date.month,band.date.day);out.push(record(source,pdfUrl,date,side.label,location,category,`${band.date.month}月${band.date.day}日 ${side.label} ${category} ${location}`));}}
    }
  }
  return [...new Map(out.map(value=>[value.id,value])).values()];
}

function saitama(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,year:number){
  const out:EnforcementRecord[]=[];
  for(const items of pages){for(const band of bands(items,"saitama")){const categories=items.filter(item=>item.transform[5]<band.upper&&item.transform[5]>=band.lower).map(item=>({item,match:clean(item.str).match(/^【(.+)】$/)})).filter((value):value is {item:PdfItem;match:RegExpMatchArray}=>Boolean(value.match));for(const {item,match} of categories){const date=iso(year,band.date.month,band.date.day),timeLabel=item.transform[4]>=450?"夜間":"昼間",category=clean(match[1]);out.push(record(source,pdfUrl,date,timeLabel,"埼玉県内全域",category,`${band.date.month}月${band.date.day}日 ${timeLabel} ${category} 埼玉県内全域`));}}}
  return [...new Map(out.map(value=>[value.id,value])).values()];
}

export function parseCoordinateSchedulePdf(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,year:number):EnforcementRecord[]{
  if(source.coordinateScheduleLayout==="chiba_two_period")return chiba(pages,source,pdfUrl,year);
  if(source.coordinateScheduleLayout==="saitama_statewide")return saitama(pages,source,pdfUrl,year);
  return [];
}
