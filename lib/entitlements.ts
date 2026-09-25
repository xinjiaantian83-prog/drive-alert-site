import type { EnforcementRecord } from "./types";

export type Plan = "free" | "pro";
export type DateScope = "today" | "week";
export type ProFeature = "proximity_notifications" | "area_alerts" | "notification_distance" | "nationwide" | "favorite_areas" | "update_notifications" | "notification_history";

export function canUseFeature(plan:Plan,feature:ProFeature){void feature;return plan==="pro";}
export function localDateKey(date:Date){const offset=date.getTimezoneOffset()*60000;return new Date(date.getTime()-offset).toISOString().slice(0,10);}
export function isInDateScope(record:Pick<EnforcementRecord,"date">,scope:DateScope,now=new Date()){
  if(!record.date)return false;
  const start=localDateKey(now);if(scope==="today")return record.date===start;
  const endDate=new Date(now);endDate.setDate(endDate.getDate()+6);const end=localDateKey(endDate);
  return record.date>=start&&record.date<=end;
}
