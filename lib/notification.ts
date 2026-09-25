import type { EnforcementRecord } from "./types";

export type NotificationRadius = 500 | 1000 | 2000;
export type Coordinates = { latitude: number; longitude: number };
export type NotificationMatch = { record: EnforcementRecord; distanceMeters: number; notificationKey: string; alreadyNotified: boolean };
export type AreaAlertMatch = { records: EnforcementRecord[]; areaKey: string; areaLabel: string; notificationKey: string; alreadyNotified: boolean };

export interface NotificationReceiptStore {
  has(key: string): boolean;
  add(key: string): void;
  clear(): void;
}

export function notificationKey(record: Pick<EnforcementRecord, "id" | "activeFrom" | "activeTo">) {
  return `proximity:${record.id}:${record.activeFrom ?? ""}:${record.activeTo ?? ""}`;
}

export function areaAlertNotificationKey(record:Pick<EnforcementRecord,"areaKey"|"activeFrom"|"activeTo">){return `area:${record.areaKey??""}:${record.activeFrom??""}:${record.activeTo??""}`;}

export function distanceMeters(a: Coordinates, b: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isWithinActiveWindow(record: Pick<EnforcementRecord, "activeFrom" | "activeTo">, now: Date) {
  if (!record.activeFrom || !record.activeTo) return false;
  const from = Date.parse(record.activeFrom);
  const to = Date.parse(record.activeTo);
  const timestamp = now.getTime();
  return Number.isFinite(from) && Number.isFinite(to) && from <= timestamp && timestamp <= to;
}

export function evaluateNotifications(
  records: EnforcementRecord[],
  currentLocation: Coordinates,
  radiusMeters: NotificationRadius,
  now: Date,
  receipts?: Pick<NotificationReceiptStore, "has">
) {
  return records.flatMap<NotificationMatch>(record => {
    if (record.notificationEligible !== true || record.latitude === null || record.longitude === null) return [];
    if (!isWithinActiveWindow(record, now)) return [];
    const distance = distanceMeters(currentLocation, { latitude: record.latitude, longitude: record.longitude });
    if (distance > radiusMeters) return [];
    const key = notificationKey(record);
    return [{ record, distanceMeters: distance, notificationKey: key, alreadyNotified: receipts?.has(key) ?? false }];
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function evaluateAreaAlerts(records:EnforcementRecord[],currentAreaKey:string,now:Date,receipts?:Pick<NotificationReceiptStore,"has">){
  const grouped=new Map<string,AreaAlertMatch>();
  for(const record of records){
    if(record.areaAlertEligible!==true||record.locationPrecision!=="area_only"||record.areaKey!==currentAreaKey||!record.areaLabel)continue;
    if(!isWithinActiveWindow(record,now))continue;
    const key=areaAlertNotificationKey(record);const existing=grouped.get(key);
    if(existing)existing.records.push(record);else grouped.set(key,{records:[record],areaKey:record.areaKey,areaLabel:record.areaLabel,notificationKey:key,alreadyNotified:receipts?.has(key)??false});
  }
  return [...grouped.values()];
}
