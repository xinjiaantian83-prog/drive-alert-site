import { getAllRecords } from "../lib/db";
import { evaluateAreaAlerts, evaluateNotifications, type NotificationRadius } from "../lib/notification";

const [latitudeValue,longitudeValue,radiusValue="1000",atValue=new Date().toISOString(),areaKey=""]=process.argv.slice(2);
const latitude=Number(latitudeValue),longitude=Number(longitudeValue),radius=Number(radiusValue) as NotificationRadius,at=new Date(atValue);
if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||![500,1000,2000].includes(radius)||Number.isNaN(at.getTime())){
  console.error("usage: npm run simulate -- <latitude> <longitude> <500|1000|2000> <ISO datetime>");process.exit(1);
}
const records=getAllRecords();const matches=evaluateNotifications(records,{latitude,longitude},radius,at);const areaAlerts=areaKey?evaluateAreaAlerts(records,areaKey,at):[];
console.log(JSON.stringify({latitude,longitude,radius,at:at.toISOString(),proximity:{count:matches.length,matches:matches.map(match=>({id:match.record.id,location:match.record.location,distanceMeters:Math.round(match.distanceMeters),activeFrom:match.record.activeFrom,activeTo:match.record.activeTo,sourceUrl:match.record.sourceUrl,updatedAt:match.record.updatedAt}))},areaAlerts:{count:areaAlerts.length,matches:areaAlerts.map(match=>({areaKey:match.areaKey,areaLabel:match.areaLabel,groupedRecords:match.records.length,activeFrom:match.records[0].activeFrom,activeTo:match.records[0].activeTo,sourceUrl:match.records[0].sourceUrl}))}},null,2));
