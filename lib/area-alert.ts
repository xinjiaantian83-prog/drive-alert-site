import type { EnforcementRecord } from "./types";

export type AreaScopeType = NonNullable<EnforcementRecord["areaScopeType"]>;

function normalized(value:string){return value.replace(/[\s　]+/g,"").toLowerCase();}

export function deriveAreaAlert(record:EnforcementRecord){
  if(record.locationPrecision!=="area_only")return {areaAlertEligible:false,areaScopeType:null,areaKey:null,areaLabel:null};
  let areaScopeType:AreaScopeType="published_area";
  let areaLabel=record.location;
  if(record.location?.includes("管内"))areaScopeType="police_district";
  else if(record.location)areaScopeType="municipality";
  else if(record.policeStation){areaScopeType="police_district";areaLabel=`${record.policeStation}管内`;}
  else if(record.route){areaScopeType="route";areaLabel=record.route;}
  if(!areaLabel)return {areaAlertEligible:false,areaScopeType:null,areaKey:null,areaLabel:null};
  return {areaAlertEligible:true,areaScopeType,areaKey:`${record.prefecture}:${areaScopeType}:${normalized(areaLabel)}`,areaLabel};
}
