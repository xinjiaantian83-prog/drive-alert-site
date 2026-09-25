import {describe,expect,it} from "vitest";
import type {SourceDefinition} from "../types";
import {parseNagasakiMonthlyPlan} from "./official-html-structures";

const source:SourceDefinition={id:"nagasaki-test",prefecture:"長崎",title:"公式",indexUrl:"https://www.police.pref.nagasaki.jp/plan/",format:"html",adapter:"nagasaki-monthly-plan"};

describe("Nagasaki monthly plan",()=>{
  it("binds the explicit month, day and time row to each published national route",()=>{
    const html=`<h2>令和８年10月</h2><table><tr><td>日</td><td>曜</td><td>時間</td><td>取締り路線(国道)</td></tr><tr><td rowspan="3">1</td><td rowspan="3">木</td><td>午前</td><td>35/204/205</td></tr><tr><td>午後</td><td>34/382</td></tr><tr><td>夜間</td><td></td></tr></table>`;
    const rows=parseNagasakiMonthlyPlan(html,source);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({date:"2026-10-01",timeLabel:"午前",location:"国道35号",route:"国道35号",category:"交通指導取締り",activeFrom:"2026-10-01",activeTo:"2026-10-01",locationPrecision:"area_only"});
    expect(rows[4]).toMatchObject({timeLabel:"午後",route:"国道382号"});
  });

  it("does not combine malformed or non-route cells",()=>{
    const html=`<h2>令和８年９月</h2><table><tr><td>日</td><td>曜</td><td>時間</td><td>路線</td></tr><tr><td rowspan="2">2</td><td rowspan="2">水</td><td>午前</td><td>県道など</td></tr><tr><td>午後</td><td>34/不明</td></tr></table>`;
    expect(parseNagasakiMonthlyPlan(html,source)).toEqual([]);
  });
});
