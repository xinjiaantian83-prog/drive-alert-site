import {describe,expect,it} from "vitest";
import {parseCoordinateSchedulePdf} from "./coordinate-schedule-pdf";
import type {PdfItem} from "./kochi";
import type {SourceDefinition} from "../types";
const item=(str:string,x:number,y:number):PdfItem=>({str,transform:[1,0,0,1,x,y]});
const source=(prefecture:"千葉"|"埼玉",layout:"chiba_two_period"|"saitama_statewide"):SourceDefinition=>({id:`test-${prefecture}`,prefecture,title:"公式公開取締り",indexUrl:"https://example.jp/index.html",format:"pdf-index",adapter:"coordinate-schedule-pdf-index",coordinateScheduleLayout:layout});
describe("coordinate schedule PDF",()=>{
  it("binds Chiba day/night cells only inside the same dated row band",()=>{const rows=parseCoordinateSchedulePdf([[item("9月18日",65,730),item("速度違反",98,768),item("千葉市中央区村田町",126,768),item("飲酒",276,721),item("船橋市本町、",304,729),item("市川市行徳駅前",304,724),item("9月19日",65,650),item("速度違反",98,678),item("高速道路全線",126,678)]],source("千葉","chiba_two_period"),"https://example.jp/a.pdf",2026);expect(rows).toHaveLength(4);expect(rows[0]).toMatchObject({date:"2026-09-18",timeLabel:"昼間",category:"速度違反",locationPrecision:"area_only",notificationEligible:false});expect(rows.filter(row=>row.date==="2026-09-18"&&row.timeLabel==="夜間").map(row=>row.location)).toEqual(["船橋市本町","市川市行徳駅前"]);});
  it("binds Saitama statewide categories to their published date",()=>{const rows=parseCoordinateSchedulePdf([[item("１０月１日",88,365),item("【速度違反】",300,417),item("【過積載】",308,352),item("１０月９日",88,260),item("【自転車及び小型モビリティによる違反】",300,294)]],source("埼玉","saitama_statewide"),"https://example.jp/b.pdf",2026);expect(rows).toHaveLength(3);expect(rows[0]).toMatchObject({date:"2026-10-01",location:"埼玉県内全域",locationPrecision:"area_only",activeTo:"2026-10-01T23:59:59+09:00"});});
});
