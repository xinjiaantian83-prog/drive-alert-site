import type{EnforcementRecord}from"./types";

export const CLOUD_STALE_HOURS=36;
export function cloudPayload(records:EnforcementRecord[],now=new Date()){
  const generatedAt=now.toISOString(),staleAfter=new Date(now.getTime()+CLOUD_STALE_HOURS*60*60*1000).toISOString();
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  return{schemaVersion:1 as const,generatedAt,staleAfter,records:records.filter(record=>!record.activeTo||record.activeTo.slice(0,10)>=today)};
}
