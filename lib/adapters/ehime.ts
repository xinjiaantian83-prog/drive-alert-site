import pdf from "pdf-parse";
import type { EnforcementRecord, SourceDefinition } from "../types";
import { reviewStatus, stableId } from "../normalize";

export const EHIME_PARSER_VERSION = "ehime-pdf-v1.0.0";
const categories = ["通学路一斉指導", "横断歩行者妨害", "通行禁止違反", "歩行者妨害", "自転車違反", "交差点違反", "ベルト等違反", "速度違反", "信号無視", "一時不停止", "飲酒運転", "携帯電話", "駐車違反"];
const routePattern = /(国道\s*\d+号|県道[^\n]*|一般県道|主要県道|市道|町道|村道)$/;

export async function extractPdfText(bytes: Buffer) { return (await pdf(bytes)).text; }

export function parseEhimeText(text: string, source: SourceDefinition, pdfUrl: string, year = new Date().getFullYear()): EnforcementRecord[] {
  const normalized = text.replace(/：/g, ":").replace(/[ \t]+/g, "");
  const month = Number(normalized.match(/(\d{1,2})月中の公開交通取締り/)?.[1]);
  const station = normalized.match(/(?:^|\n)([^\n]{1,12}署)(?:\n|$)/)?.[1] ?? null;
  const tableStart = normalized.indexOf("日曜日時");
  if (!month || tableStart < 0) return [];
  const table = normalized.slice(tableStart).split(/★|※/)[0];
  const records: EnforcementRecord[] = [];
  for (let index = 1; index <= 20; index++) {
    const rowStart = new RegExp(`(?:^|\\n)${index}(\\d{1,2})日([日月火水木金土])(\\d{1,2}:\\d{2})[～~](\\d{1,2}:\\d{2})`).exec(table);
    if (!rowStart) continue;
    const start = rowStart.index + rowStart[0].length;
    const next = new RegExp(`\\n${index + 1}\\d{1,2}日`).exec(table.slice(start));
    const body = table.slice(start, next ? start + next.index : undefined).replace(/\n/g, "");
    const category = categories.find(c => body.startsWith(c)) ?? null;
    const afterCategory = category ? body.slice(category.length) : body;
    const route = afterCategory.match(routePattern)?.[1]?.replace(/\s/g, "") ?? null;
    const location = route ? afterCategory.slice(0, -route.length) || null : afterCategory || null;
    const date = `${year}-${String(month).padStart(2,"0")}-${rowStart[1].padStart(2,"0")}`;
    const review = reviewStatus({ date, category });
    records.push({ id:stableId([source.id,date,rowStart[3],location,category]), prefecture:"愛媛", date, timeLabel:`${rowStart[3]}〜${rowStart[4]}`, startTime:rowStart[3], endTime:rowStart[4], location, route, category, policeStation:station, latitude:null, longitude:null, locationPrecision:location ? "approximate" : "unresolved", sourceUrl:pdfUrl, sourceTitle:source.title, ...review, rawText:`${rowStart[1]}日 ${rowStart[2]} ${rowStart[3]}〜${rowStart[4]} ${body}` });
  }
  return records;
}
