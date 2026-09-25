import {describe,expect,it} from "vitest";
import {parseMonthlyPdf} from "./monthly-pdf";
import type {SourceDefinition} from "../types";
const source:SourceDefinition={id:"ibaraki",prefecture:"茨城",title:"公式",indexUrl:"https://example.jp",format:"pdf-index",adapter:"monthly-pdf-index"};
describe("monthly PDF",()=>{it("parses repeated date and route rows without exact promotion",()=>{const rows=parseMonthlyPdf("9 月 1 日 ( 火 )\n１ 水戸 国 道 ６ 号 水戸市浜田町地内（はまだちょう）３箇所\n２ 大宮 国道１２３号 常陸大宮市野口地内（のぐち）３箇所",source,"https://example.jp/a.pdf",2026);expect(rows).toHaveLength(2);expect(rows[0]).toMatchObject({date:"2026-09-01",policeStation:"水戸",route:"国道6号",location:"水戸市浜田町地内",locationPrecision:"approximate"});});});
