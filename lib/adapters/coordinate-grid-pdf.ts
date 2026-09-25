import type {PdfItem} from "./kochi";
import type {EnforcementRecord,SourceDefinition} from "../types";
import {reviewStatus,stableId} from "../normalize";

export const COORDINATE_GRID_PDF_VERSION="coordinate-grid-pdf-v1.5.0";
const digits=(value:string)=>value.replace(/[０-９]/g,char=>String.fromCharCode(char.charCodeAt(0)-0xfee0));
const clean=(value:string)=>digits(value).replace(/[ \t　]+/g," ").trim();
const iso=(year:number,month:number,day:number)=>`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
function makeRecord(source:SourceDefinition,pdfUrl:string,date:string,timeLabel:string|null,location:string,route:string|null,category:string,policeStation:string|null,rawText:string):EnforcementRecord{const review=reviewStatus({date,category});return{id:stableId([source.id,date,timeLabel,location,route,category,policeStation]),prefecture:source.prefecture,date,timeLabel,startTime:null,endTime:null,location,route,category,policeStation,latitude:null,longitude:null,locationPrecision:"area_only",activeFrom:`${date}T00:00:00+09:00`,activeTo:`${date}T23:59:59+09:00`,notificationEligible:false,sourceUrl:pdfUrl,sourceTitle:source.title,...review,rawText};}
const byY=(items:PdfItem[],tolerance=1.5)=>{const rows:PdfItem[][]=[];for(const item of [...items].sort((a,b)=>b.transform[5]-a.transform[5])){const row=rows.find(value=>Math.abs(value[0].transform[5]-item.transform[5])<=tolerance);if(row)row.push(item);else rows.push([item]);}return rows.map(row=>row.sort((a,b)=>a.transform[4]-b.transform[4]));};

function parseFukui(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,year:number){const items=pages[0]??[],dates=byY(items.filter(item=>item.transform[4]>=115&&item.transform[4]<205)).map(row=>({text:row.map(item=>clean(item.str)).join(""),y:row[0].transform[5]})).map(value=>({...value,match:value.text.match(/(\d{1,2})月(\d{1,2})日/)})).filter((value):value is typeof value&{match:RegExpMatchArray}=>Boolean(value.match));const out:EnforcementRecord[]=[];for(const row of byY(items.filter(item=>item.transform[4]>=225&&item.transform[5]<770))){const time=row.find(item=>item.transform[4]>=295&&item.transform[4]<340&&/午前|午後|夜間/.test(clean(item.str)));const location=row.find(item=>item.transform[4]>=340&&item.transform[4]<520),route=row.find(item=>item.transform[4]>=520&&item.transform[4]<700),category=row.find(item=>item.transform[4]>=700&&item.transform[4]<880);if(!time||!location||!route||!category)continue;const date=[...dates].sort((a,b)=>Math.abs(a.y-time.transform[5])-Math.abs(b.y-time.transform[5]))[0];if(!date||Math.abs(date.y-time.transform[5])>25)continue;const station=clean(row.filter(item=>item.transform[4]>=225&&item.transform[4]<290).map(item=>item.str).join(""));const dateIso=iso(year,Number(date.match[1]),Number(date.match[2])),values={time:clean(time.str),location:clean(location.str),route:clean(route.str),category:clean(category.str)};out.push(makeRecord(source,pdfUrl,dateIso,values.time,values.location,values.route,values.category,station?`${station}署`:null,`${date.text} ${station} ${values.time} ${values.location} ${values.route} ${values.category}`));}return out;}

const kagoshimaColumns=[[{x:60,label:"国道3号"},{x:215,label:"国道10号"},{x:383,label:"鹿児島市内"},{x:610,label:"南薩方面"}],[{x:60,label:"北薩方面"},{x:279,label:"姶良方面"},{x:498,label:"大隅方面"}],[{x:61,label:"種子・屋久方面"},{x:402,label:"奄美方面"}]];
function parseKagoshima(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,year:number,month:number){const out:EnforcementRecord[]=[];pages.forEach((items,pageIndex)=>{const columns=kagoshimaColumns[pageIndex]??[];for(const row of byY(items.filter(item=>item.transform[5]>100&&item.transform[5]<515),1)){const dateItem=row.find(item=>item.transform[4]<40&&/^\d{1,2}日$/.test(clean(item.str)));if(!dateItem)continue;const day=Number(clean(dateItem.str).replace("日","")),date=iso(year,month,day);for(const item of row.filter(item=>item.transform[4]>=55)){const column=[...columns].sort((a,b)=>Math.abs(a.x-item.transform[4])-Math.abs(b.x-item.transform[4]))[0];if(!column||Math.abs(column.x-item.transform[4])>8)continue;const category=clean(item.str);if(!category)continue;out.push(makeRecord(source,pdfUrl,date,null,column.label,null,category,null,`${month}月${day}日 ${column.label} ${category}`));}}});return out;}

function parseYamagata(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,year:number){
  const items=pages[0]??[],monthText=items.map(item=>clean(item.str)).find(value=>/^（?\d{1,2}月分）?$/.test(value));
  const month=Number(monthText?.match(/\d{1,2}/)?.[0]);if(!month)return[];
  const dates=items.filter(item=>/^\d{1,2}$/.test(clean(item.str))).map(item=>({...item,day:Number(clean(item.str))})).filter(item=>item.day>=1&&item.day<=31&&item.transform[4]>=80&&item.transform[4]<=740&&item.transform[5]>=140&&item.transform[5]<=450);
  const stations=items.filter(item=>/署$/.test(clean(item.str))&&item.transform[5]>=140&&item.transform[5]<=430),out:EnforcementRecord[]=[];
  for(const stationItem of stations){
    const station=clean(stationItem.str),categoryItem=items.filter(item=>/取締り$/.test(clean(item.str))&&Math.abs(item.transform[5]-stationItem.transform[5])<=1.5&&Math.abs(item.transform[4]-stationItem.transform[4])<75).sort((a,b)=>Math.abs(a.transform[4]-stationItem.transform[4])-Math.abs(b.transform[4]-stationItem.transform[4]))[0];
    const dateItem=dates.filter(item=>item.transform[5]>stationItem.transform[5]&&item.transform[5]-stationItem.transform[5]<60&&Math.abs(item.transform[4]-stationItem.transform[4])<55).sort((a,b)=>(a.transform[5]-stationItem.transform[5])-(b.transform[5]-stationItem.transform[5]))[0];
    if(!categoryItem||!dateItem)continue;const date=iso(year,month,dateItem.day),category=clean(categoryItem.str),location=`${station}管内`;
    out.push(makeRecord(source,pdfUrl,date,null,location,null,category,station,`${month}月${dateItem.day}日 ${station} ${category}`));
  }
  return out;
}

function parseYamaguchi(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string){
  const items=pages[0]??[],title=items.map(item=>clean(item.str)).find(value=>/^速度取締り計画（令和\d+年\d+月/.test(value));
  const period=title?.match(/令和(\d+)年(\d+)月/);if(!period)return[];
  const year=2018+Number(period[1]),month=Number(period[2]);
  const dates=items.filter(item=>/^\d{1,2}日$/.test(clean(item.str))&&item.transform[4]<62).map(item=>({...item,day:Number(clean(item.str).replace("日",""))}));
  const routes=items.filter(item=>item.transform[4]>=83&&item.transform[4]<100&&/^(?:国道|その他道路)/.test(clean(item.str))),out:EnforcementRecord[]=[];
  for(const routeItem of routes){
    const dateItem=[...dates].sort((a,b)=>Math.abs(a.transform[5]-routeItem.transform[5])-Math.abs(b.transform[5]-routeItem.transform[5]))[0];
    if(!dateItem||Math.abs(dateItem.transform[5]-routeItem.transform[5])>24)continue;
    const route=clean(routeItem.str),date=iso(year,month,dateItem.day);
    for(const column of [{min:115,max:247,label:"昼間（6時00分～18時00分）"},{min:247,max:378,label:"早朝・夜間（18時00分～翌6時00分）"}]){
      const stationText=clean(items.filter(item=>item.transform[4]>=column.min&&item.transform[4]<column.max&&Math.abs(item.transform[5]-routeItem.transform[5])<=1.5).map(item=>item.str).join(""));
      for(const name of stationText.split(/[、,]/).map(value=>value.trim()).filter(Boolean)){
        const station=name.endsWith("署")?name:`${name}署`,location=`${station}管内`;
        out.push(makeRecord(source,pdfUrl,date,column.label,location,route,"速度違反取締り",station,`${month}月${dateItem.day}日 ${column.label} ${route} ${station}`));
      }
    }
  }
  return out;
}

function parseNiigata(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,currentYear:number){
  const items=pages[0]??[],title=items.map(item=>clean(item.str)).find(value=>/^\d{1,2}月中の公開交通取締り$/.test(value));
  const month=Number(title?.match(/^\d{1,2}/)?.[0]);if(!month)return[];
  const dates=items.filter(item=>/^\d{1,2}月\d{1,2}日$/.test(clean(item.str))).map(item=>({...item,day:Number(clean(item.str).match(/月(\d{1,2})日/)?.[1])}));
  const stations=items.filter(item=>item.transform[5]>=90&&item.transform[5]<750&&((item.transform[4]>=220&&item.transform[4]<260)||(item.transform[4]>=450&&item.transform[4]<490))),out:EnforcementRecord[]=[];
  for(const stationItem of stations){
    const right=stationItem.transform[4]>=400,dateItem=dates.filter(item=>(item.transform[4]>=280)===right).sort((a,b)=>Math.abs(a.transform[5]-stationItem.transform[5])-Math.abs(b.transform[5]-stationItem.transform[5]))[0];
    const categoryItem=items.filter(item=>Math.abs(item.transform[5]-stationItem.transform[5])<=1.5&&(right?item.transform[4]>=350&&item.transform[4]<450:item.transform[4]>=130&&item.transform[4]<220)).sort((a,b)=>Math.abs(a.transform[4]-stationItem.transform[4])-Math.abs(b.transform[4]-stationItem.transform[4]))[0];
    if(!dateItem||!categoryItem||Math.abs(dateItem.transform[5]-stationItem.transform[5])>13)continue;
    const stationName=clean(stationItem.str),station=stationName.endsWith("署")?stationName:`${stationName}署`,category=clean(categoryItem.str),date=iso(currentYear,month,dateItem.day);
    out.push(makeRecord(source,pdfUrl,date,null,`${station}管内`,null,category,station,`${month}月${dateItem.day}日 ${category} ${station}`));
  }
  return out;
}

function parseWakayama(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,currentYear:number){
  const all=pages.flat(),heading=all.map(item=>clean(item.str).replace(/\s/g,"")).find(value=>/^(?:紀北|和歌山市内|紀中・紀南)$/.test(value));
  const layouts=heading==="紀北"?
    [{x:182,station:"橋本警察署"},{x:294,station:"かつらぎ警察署"},{x:422,station:"岩出警察署"}]:
    heading==="和歌山市内"?
      [{x:173,station:"和歌山東警察署"},{x:286,station:"和歌山西警察署"},{x:408,station:"和歌山北警察署"}]:
      heading==="紀中・紀南"?
        [{x:182,station:"海南・有田湯浅警察署"},{x:304,station:"御坊・田辺警察署"},{x:425,station:"白浜・新宮警察署"}]:[];
  if(!layouts.length)return[];const out:EnforcementRecord[]=[];
  for(const items of pages){
    const dates=items.filter(item=>/^\d{1,2}\/\d{1,2}$/.test(clean(item.str))&&item.transform[4]<90);
    for(const dateItem of dates){
      const match=clean(dateItem.str).match(/^(\d{1,2})\/(\d{1,2})$/);if(!match)continue;
      const date=iso(currentYear,Number(match[1]),Number(match[2]));
      for(const column of layouts){
        const locationItem=items.filter(item=>Math.abs(item.transform[4]-column.x)<40&&item.transform[5]>dateItem.transform[5]+3&&item.transform[5]<dateItem.transform[5]+16).sort((a,b)=>Math.abs(a.transform[4]-column.x)-Math.abs(b.transform[4]-column.x))[0];
        const timeItem=items.filter(item=>Math.abs(item.transform[4]-column.x)<40&&item.transform[5]<dateItem.transform[5]-3&&item.transform[5]>dateItem.transform[5]-16&&/\d{1,2}[:：]\d{2}/.test(clean(item.str))).sort((a,b)=>Math.abs(a.transform[4]-column.x)-Math.abs(b.transform[4]-column.x))[0];
        if(!locationItem||!timeItem)continue;const location=clean(locationItem.str),timeLabel=clean(timeItem.str).replace(/－/g,"～");
        out.push(makeRecord(source,pdfUrl,date,timeLabel,location,null,"交通指導取締り",column.station,`${clean(dateItem.str)} ${column.station} ${location} ${timeLabel}`));
      }
    }
  }
  return out;
}

function parseSaga(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,currentYear:number){
  const items=pages[0]??[],title=items.map(item=>clean(item.str)).find(value=>/速度取締り装置による速度取締り計画（\d{1,2}月中）/.test(value));
  const month=Number(title?.match(/（(\d{1,2})月中）/)?.[1]);if(!month)return[];
  const stations=[{x:144,name:"佐賀南警察署"},{x:184,name:"佐賀北警察署"},{x:224,name:"神埼警察署"},{x:264,name:"鳥栖警察署"},{x:304,name:"小城警察署"},{x:344,name:"唐津警察署"},{x:384,name:"伊万里警察署"},{x:425,name:"武雄警察署"},{x:465,name:"白石警察署"},{x:505,name:"鹿島警察署"}],out:EnforcementRecord[]=[];
  const dates=items.filter(item=>/^\d{1,2}$/.test(clean(item.str))&&item.transform[4]>=60&&item.transform[4]<90&&item.transform[5]>150&&item.transform[5]<670);
  for(const dateItem of dates){const day=Number(clean(dateItem.str)),date=iso(currentYear,month,day);for(const mark of items.filter(item=>clean(item.str)==="●"&&Math.abs(item.transform[5]-dateItem.transform[5])<=1.5)){const station=[...stations].sort((a,b)=>Math.abs(a.x-mark.transform[4])-Math.abs(b.x-mark.transform[4]))[0];if(!station||Math.abs(station.x-mark.transform[4])>4)continue;out.push(makeRecord(source,pdfUrl,date,null,`${station.name}管内`,null,"速度取締り装置による速度取締り",station.name,`${month}月${day}日 ${station.name} 速度取締り装置`));}}
  return out;
}

function parseIwate(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,currentYear:number){
  const out:EnforcementRecord[]=[];
  for(const items of pages){const dateText=items.map(item=>clean(item.str)).find(value=>/^\d{1,2}月\d{1,2}日\(.+\)$/.test(value)),match=dateText?.match(/^(\d{1,2})月(\d{1,2})日/);if(!match)continue;const date=iso(currentYear,Number(match[1]),Number(match[2]));
    for(const item of items.filter(value=>value.transform[4]>=160&&value.transform[5]>350&&value.transform[5]<560&&/(?:国道|県道|主要地方道|市道|自動車道)/.test(clean(value.str)))){const text=clean(item.str),timeLabel=item.transform[5]>415?"日中":"夜間",route=text.match(/(?:国道\d+号|主要地方道|県道|市道|[一-龠ぁ-んァ-ヶＡ-ＺA-Z]+自動車道)/)?.[0]??null;out.push(makeRecord(source,pdfUrl,date,timeLabel,text,route,"交通指導取締り",null,`${dateText} ${timeLabel} ${text}`));}
  }
  return out;
}

function parseAkita(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,currentYear:number){
  const title=pages.flat().map(item=>clean(item.str)).find(value=>/^\d{1,2}月の重点$/.test(value)),month=Number(title?.match(/^\d{1,2}/)?.[0]);if(!month)return[];const out:EnforcementRecord[]=[];
  for(const items of pages){const dates=items.filter(item=>/^\d{1,2}日\(.+\)$/.test(clean(item.str))&&item.transform[4]<75);for(const dateItem of dates){const day=Number(clean(dateItem.str).match(/^\d{1,2}/)?.[0]),date=iso(currentYear,month,day);for(const column of [{min:90,max:255,label:"午前"},{min:255,max:430,label:"午後"},{min:430,max:540,label:"夜間"}]){const stationItem=items.filter(item=>item.transform[4]>=column.min&&item.transform[4]<column.max&&item.transform[5]>dateItem.transform[5]+8&&item.transform[5]<dateItem.transform[5]+31&&/警察署$/.test(clean(item.str)))[0];const categoryItem=items.filter(item=>item.transform[4]>=column.min&&item.transform[4]<column.max&&Math.abs(item.transform[5]-dateItem.transform[5])<=2&&/取締り$/.test(clean(item.str)))[0];if(!stationItem||!categoryItem)continue;const station=clean(stationItem.str),category=clean(categoryItem.str);out.push(makeRecord(source,pdfUrl,date,column.label,`${station}管内`,null,category,station,`${month}月${day}日 ${column.label} ${station} ${category}`));}}}
  return out;
}

export function parseCoordinateGridPdf(pages:PdfItem[][],source:SourceDefinition,pdfUrl:string,currentYear=new Date().getFullYear()):EnforcementRecord[]{if(source.coordinateGridLayout==="fukui_daily_rows")return parseFukui(pages,source,pdfUrl,currentYear);if(source.coordinateGridLayout==="kagoshima_area_matrix"){const title=pages.flat().map(item=>clean(item.str)).find(value=>/令和\d+年\d+月中交通指導取締り計画表/.test(value));const match=title?.match(/令和(\d+)年(\d+)月/);if(!match)return[];return parseKagoshima(pages,source,pdfUrl,2018+Number(match[1]),Number(match[2]));}if(source.coordinateGridLayout==="yamagata_calendar_cells")return parseYamagata(pages,source,pdfUrl,currentYear);if(source.coordinateGridLayout==="yamaguchi_route_time_matrix")return parseYamaguchi(pages,source,pdfUrl);if(source.coordinateGridLayout==="niigata_two_column_daily")return parseNiigata(pages,source,pdfUrl,currentYear);if(source.coordinateGridLayout==="wakayama_three_area_daily")return parseWakayama(pages,source,pdfUrl,currentYear);if(source.coordinateGridLayout==="saga_station_symbol_matrix")return parseSaga(pages,source,pdfUrl,currentYear);if(source.coordinateGridLayout==="iwate_daily_cards")return parseIwate(pages,source,pdfUrl,currentYear);if(source.coordinateGridLayout==="akita_three_period_daily")return parseAkita(pages,source,pdfUrl,currentYear);return[];}
