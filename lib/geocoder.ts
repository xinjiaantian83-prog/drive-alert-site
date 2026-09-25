import type { EnforcementRecord } from "./types";
import { getGeocodeCache, saveGeocodeCache } from "./db";

const endpoint="https://msearch.gsi.go.jp/address-search/AddressSearch";
export async function geocodeApproximate(record:EnforcementRecord):Promise<EnforcementRecord>{
  if(record.locationPrecision!=="approximate"||!record.location||record.latitude!==null||record.coordinateVerified===false)return record;
  const query=`${record.prefecture}県${record.location}`;const cached=getGeocodeCache(query);if(cached)return apply(record,cached);
  const response=await fetch(`${endpoint}?q=${encodeURIComponent(query)}`,{headers:{"user-agent":process.env.USER_AGENT??"ShikokuTrafficWatch/0.1"},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`GSI geocode HTTP ${response.status}`);
  const results=await response.json() as Array<{geometry:{coordinates:[number,number]};properties:{title:string}}>;
  const best=results[0];if(!best)return record;
  const normalize=(v:string)=>v.replace(/[\s　]/g,"");const verified=normalize(best.properties.title).endsWith(normalize(record.location));
  const value={latitude:best.geometry.coordinates[1],longitude:best.geometry.coordinates[0],resultTitle:best.properties.title,verified};saveGeocodeCache(query,value);return apply(record,value);
}
function apply(record:EnforcementRecord,value:{latitude:number;longitude:number;resultTitle:string;verified:boolean}):EnforcementRecord{
  if(!value.verified)return record;
  return {...record,latitude:value.latitude,longitude:value.longitude,coordinateSource:`国土地理院住所検索: ${value.resultTitle}`,coordinateVerified:true,locationPrecision:"approximate"};
}
