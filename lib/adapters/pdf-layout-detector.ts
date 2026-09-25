import type {EnforcementRecord,SourceDefinition} from "../types";
import {parseMonthlyPdf} from "./monthly-pdf";
import {parseRegionalSchedulePdf} from "./regional-schedule-pdf";

export type PdfLayout="hyogo_like"|"ibaraki_like"|"broken_columns"|"unknown";
export type UnknownPdfSubtype="coordinate_triplet_table"|"statewide_calendar"|"station_symbol_matrix"|"narrative_policy"|"unknown";
const compact=(value:string)=>value.replace(/[\s　]+/g,"");
export function detectPdfLayout(text:string):PdfLayout{
  const value=compact(text);
  if(/取締り重点路線取締り内容/.test(value)&&/(?:交差点関連|速度|飲酒)/.test(value)&&/\d{1,2}[月火水木金土日]/.test(value))return "hyogo_like";
  if(/交通安全指導[・･]取締り情報/.test(value)&&/警察署道路名実施場所/.test(value)&&/\d+[^\n]*(?:国道|県道|市道)/.test(text))return "ibaraki_like";
  if(/月日曜日取締重点署別/.test(value)||(/取締り時間帯及び実施警察署/.test(value)&&/取締り路線/.test(value)))return "broken_columns";
  return "unknown";
}
export function detectUnknownPdfSubtype(text:string):UnknownPdfSubtype{
  const value=compact(text);
  if(/公開交通指導取締り計画/.test(value)&&/早朝[～〜]午前/.test(value)&&/夕方[～〜]夜間/.test(value))return "coordinate_triplet_table";
  if(/県内全域取締日/.test(value)&&/(?:実施日|実施期間)/.test(value))return "statewide_calendar";
  if(/速度取締り装置による速度取締り計画/.test(value)&&/警察署/.test(value))return "station_symbol_matrix";
  if(/(?:交通安全計画|取締り指針|速度管理指針|交通安全対策)/.test(value)&&!/(?:月日|実施日|曜日|時間帯)/.test(value))return "narrative_policy";
  return "unknown";
}
export function parseDetectedSchedulePdf(text:string,source:SourceDefinition,pdfUrl:string):{layout:PdfLayout;records:EnforcementRecord[]}{
  const layout=detectPdfLayout(text);if(layout==="hyogo_like")return {layout,records:parseRegionalSchedulePdf(text,source,pdfUrl)};if(layout==="ibaraki_like")return {layout,records:parseMonthlyPdf(text,source,pdfUrl)};return {layout,records:[]};
}
