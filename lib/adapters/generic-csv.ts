import type { EnforcementRecord, SourceDefinition } from "../types";
import { clean, reviewStatus, stableId } from "../normalize";

export const GENERIC_CSV_VERSION = "generic-csv-v1.0.0";

export function parseCsv(text: string) {
  const rows:string[][]=[];
  let row:string[]=[],cell="",quoted=false;
  const input=text.replace(/^\uFEFF/,"");
  for(let i=0;i<input.length;i++){
    const char=input[i];
    if(char==='"'){
      if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
    }else if(char===","&&!quoted){row.push(cell);cell="";}
    else if((char==="\n"||char==="\r")&&!quoted){
      if(char==="\r"&&input[i+1]==="\n")i++;
      row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell="";
    }else cell+=char;
  }
  row.push(cell);if(row.some(Boolean))rows.push(row);
  return rows;
}

const field=(row:string[],headers:string[],names:RegExp)=>{const index=headers.findIndex(value=>names.test(value));return index>=0?clean(row[index]):null;};
export function parseGenericCsv(text:string,source:SourceDefinition,csvUrl:string):EnforcementRecord[]{
  const rows=parseCsv(text);if(rows.length<2)return[];
  const headers=rows[0].map(value=>clean(value)??"");
  return rows.slice(1).flatMap(row=>{
    const rawDate=field(row,headers,/^(日|日付|年月日)$/),match=rawDate?.match(/(\d{4})[年/]\s*(\d{1,2})[月/]\s*(\d{1,2})日?/);
    const date=match?`${match[1]}-${match[2].padStart(2,"0")}-${match[3].padStart(2,"0")}`:null;
    const timeLabel=field(row,headers,/時間/),location=field(row,headers,/場所|地域|地区/),category=field(row,headers,/種別|重点|違反/),route=field(row,headers,/路線|道路/),policeStation=field(row,headers,/警察署|所属/);
    if(!rawDate&&!location&&!category)return [];
    const review=reviewStatus({date,category});
    return [{id:stableId([source.id,date,timeLabel,location,route,category,policeStation]),prefecture:source.prefecture,date,timeLabel,startTime:null,endTime:null,location,route,category,policeStation,latitude:null,longitude:null,locationPrecision:location?(/市内|区内|町内|村内|管内|全域|一円/.test(location)?"area_only":"approximate"):"unresolved",sourceUrl:csvUrl,sourceTitle:source.title,...review,rawText:row.join(" ")}];
  });
}
