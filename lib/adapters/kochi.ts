import pdf from "pdf-parse";
import type { EnforcementRecord, SourceDefinition } from "../types";
import { reviewStatus, stableId } from "../normalize";

export const KOCHI_PARSER_VERSION="kochi-pdf-v1.0.0";
export type PdfItem={str:string;transform:number[]};
const stations=["高知署","高知南署","高知東署","室戸署","安芸署","南国署","土佐署","佐川署","須崎署","窪川署","中村署","宿毛署"];

export async function extractKochiPages(bytes:Buffer){const pages:PdfItem[][]=[]; let extracted="";
  await pdf(bytes,{pagerender:async page=>{const tc=await page.getTextContent({normalizeWhitespace:true}); pages.push(tc.items as PdfItem[]); const t=tc.items.map((i:PdfItem)=>i.str).join(" "); extracted+=t+"\n"; return t;}});
  return {pages,extractedText:extracted};
}
export function parseKochiPages(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,year=new Date().getFullYear()):EnforcementRecord[]{
  const monthText=pages[0]?.find(i=>/[０-９0-9]+月/.test(i.str))?.str ?? ""; const month=Number(monthText.replace(/[０-９]/g,c=>String("０１２３４５６７８９".indexOf(c))).match(/\d+/)?.[0]); if(!month)return[];
  const out:EnforcementRecord[]=[];
  for(const items of pages){const times=items.filter(i=>["午前","午後"].includes(i.str)&&i.transform[4]<140); const days=items.filter(i=>/^[０-９0-9]{1,2}$/.test(i.str)&&i.transform[4]<115).map(i=>({...i,day:Number(i.str.replace(/[０-９]/g,c=>String("０１２３４５６７８９".indexOf(c))))})).filter(i=>i.day>=1&&i.day<=31);
    for(const time of times){const y=time.transform[5]; const day=days.sort((a,b)=>Math.abs(a.transform[5]-y)-Math.abs(b.transform[5]-y))[0]?.day; if(!day)continue;
      stations.forEach((station,index)=>{const targetX=152.4+32.4*index; const chars=items.filter(i=>Math.abs(i.transform[4]-targetX)<4&&Math.abs(i.transform[5]-y)<35).sort((a,b)=>b.transform[5]-a.transform[5]).map(i=>i.str); const category=chars.join("").trim()||null; if(!category)return;
        const date=`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`; const review=reviewStatus({date,category}); out.push({id:stableId([source.id,date,time.str,station,category]),prefecture:"高知",date,timeLabel:time.str,startTime:null,endTime:null,location:`${station}管内`,route:null,category,policeStation:station,latitude:null,longitude:null,locationPrecision:"area_only",sourceUrl:pdfUrl,sourceTitle:source.title,...review,rawText:`${day}日 ${time.str} ${station} ${category}`});});
    }
  } return out;
}
