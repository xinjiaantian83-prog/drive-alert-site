import { describe,expect,it } from "vitest";
import { parseGenericCsv } from "./generic-csv";
import type { SourceDefinition } from "../types";
const source:SourceDefinition={id:"oita",prefecture:"大分",title:"公式CSV",indexUrl:"https://example.jp/index",format:"csv-index",adapter:"generic-csv-index"};
describe("generic CSV",()=>{
  it("parses BOM CSV and never guesses exact",()=>{const rows=parseGenericCsv("\uFEFF日,曜日,時間帯,場所,取締種別\r\n2026/9/16,水,午前,中津市植野,速度違反\r\n2026/9/17,木,午前,大分市内,バスレーン\r\n",source,"https://example.jp/a.csv");expect(rows).toHaveLength(2);expect(rows[0]).toMatchObject({date:"2026-09-16",locationPrecision:"approximate",sourceUrl:"https://example.jp/a.csv"});expect(rows[1].locationPrecision).toBe("area_only");expect(rows.some(row=>row.locationPrecision==="exact")).toBe(false);});
});
