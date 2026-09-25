import * as cheerio from "cheerio";
import type { EnforcementRecord, SourceDefinition } from "../types";
import { clean, reviewStatus, stableId } from "../normalize";

export function parseTokushima(html: string, source: SourceDefinition, year = new Date().getFullYear()): EnforcementRecord[] {
  const $ = cheerio.load(html); const records: EnforcementRecord[] = [];
  const monthText = $("h2").first().text(); const month = Number(monthText.match(/(\d{1,2})月/)?.[1]);
  $("table tr").each((_, tr) => {
    const cells = $(tr).find("th,td").map((__, c) => clean($(c).text())).get().filter(Boolean) as string[];
    if (cells.length < 5 || !/^\d{1,2}$/.test(cells[0])) return;
    const day = Number(cells[0]); const time = cells[2];
    for (let i = 3; i + 2 < cells.length; i += 3) {
      const location = cells[i], route = cells[i+1], category = cells[i+2]; if (!location && !category) continue;
      const date = month ? `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}` : null;
      const base = { date, category: category ?? null }; const review = reviewStatus(base);
      records.push({ id: stableId([source.id,date,time,location,route,category]), prefecture:"徳島", date, timeLabel:time ?? null, startTime:null, endTime:null, location:location ?? null, route:route ?? null, category:category ?? null, policeStation:null, latitude:null, longitude:null, locationPrecision:location ? "approximate" : "unresolved", sourceUrl:source.indexUrl, sourceTitle:source.title, ...review, rawText:cells.join(" ") });
    }
  }); return records;
}
