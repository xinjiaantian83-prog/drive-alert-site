import {describe,expect,it} from "vitest";import {detectPdfLayout,detectUnknownPdfSubtype} from "./pdf-layout-detector";
describe("PDF layout detector",()=>{it.each([
  ["取締り重点路線 取締り内容\n17木\n神戸国道2号速度","hyogo_like"],
  ["交通安全指導・取締り情報\n警察署 道路名 実施場所\n1 水戸 国道6号 水戸市","ibaraki_like"],
  ["月日 曜日 取締重点署別\n速度\n新潟中央\n9月1日","broken_columns"],
  ["取締り時間帯及び実施警察署\n取締り路線\n16日","broken_columns"],
  ["速度取締りを実施します","unknown"]
] as const)("classifies without guessing",(text,expected)=>expect(detectPdfLayout(text)).toBe(expected));});
describe("unknown PDF subtype",()=>{it.each([
  ["公開交通指導取締り計画 早朝～午前 午後 夕方～夜間","coordinate_triplet_table"],
  ["県内全域取締日 実施日 9月1日","statewide_calendar"],
  ["速度取締り装置による速度取締り計画 警察署 ○印","station_symbol_matrix"],
  ["交通安全計画 基本方針","narrative_policy"],
  ["速度取締りを実施します","unknown"]
] as const)("subclassifies conservatively",(text,expected)=>expect(detectUnknownPdfSubtype(text)).toBe(expected));});
