import { createHash } from "node:crypto";
import type { EnforcementRecord } from "./types";

export function stableId(parts: Array<string | null | undefined>) {
  return createHash("sha256").update(parts.map(v => v ?? "").join("|")).digest("hex").slice(0, 24);
}
export function clean(value?: string | null) {
  const v = value?.replace(/[\u00a0\s]+/g, " ").trim();
  return v || null;
}
export function reviewStatus(record: Pick<EnforcementRecord, "date" | "category">) {
  const reasons: string[] = [];
  if (!record.date) reasons.push("日付を特定できません");
  if (!record.category) reasons.push("取締り種別を特定できません");
  return { status: reasons.length ? "needs_review" as const : "confirmed" as const, reviewReason: reasons.length ? reasons.join(" / ") : null };
}

export function isGeofenceEligible(record: EnforcementRecord) {
  return record.latitude !== null && record.longitude !== null &&
    (record.locationPrecision === "exact" ||
      (record.locationPrecision === "approximate" && record.coordinateVerified === true));
}

function isoAt(date:string,time:string){const [h,m]=time.split(":");return `${date}T${h.padStart(2,"0")}:${(m??"00").padStart(2,"0")}:00+09:00`;}
export function activeWindow(record:Pick<EnforcementRecord,"date"|"startTime"|"endTime"|"timeLabel">){
  if(!record.date)return {activeFrom:null,activeTo:null};
  if(record.startTime&&record.endTime)return {activeFrom:isoAt(record.date,record.startTime),activeTo:isoAt(record.date,record.endTime)};
  const ranges:Record<string,[string,string]>={"午前":["00:00","11:59"],"朝":["00:00","11:59"],"午後":["12:00","17:59"],"昼間":["12:00","17:59"],"夜間":["18:00","23:59"]};
  const range=record.timeLabel?ranges[record.timeLabel]:null;
  return range?{activeFrom:isoAt(record.date,range[0]),activeTo:isoAt(record.date,range[1])}:{activeFrom:isoAt(record.date,"00:00"),activeTo:isoAt(record.date,"23:59")};
}
export function isCurrentlyActive(record:Pick<EnforcementRecord,"activeFrom"|"activeTo">,now=new Date()){
  return Boolean(record.activeFrom&&record.activeTo&&new Date(record.activeFrom)<=now&&now<=new Date(record.activeTo));
}
