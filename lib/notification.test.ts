import { describe, expect, it } from "vitest";
import { distanceMeters, evaluateAreaAlerts, evaluateNotifications, notificationKey } from "./notification";
import type { EnforcementRecord } from "./types";

const base: EnforcementRecord = { id:"one",prefecture:"愛媛",date:"2026-09-24",timeLabel:null,startTime:null,endTime:null,location:"テスト",route:null,category:"速度",policeStation:null,latitude:33.84,longitude:132.76,locationPrecision:"approximate",coordinateVerified:true,activeFrom:"2026-09-24T10:00:00+09:00",activeTo:"2026-09-24T12:00:00+09:00",notificationEligible:true,sourceUrl:"https://example.com",sourceTitle:"公式",status:"confirmed",reviewReason:null,rawText:"test" };

describe("notification engine",()=>{
  it("calculates distance and filters by eligibility, radius and active window",()=>{
    expect(distanceMeters({latitude:33.84,longitude:132.76},{latitude:33.84,longitude:132.76})).toBe(0);
    const now=new Date("2026-09-24T11:00:00+09:00");
    expect(evaluateNotifications([base],{latitude:33.84,longitude:132.76},500,now)).toHaveLength(1);
    expect(evaluateNotifications([{...base,notificationEligible:false}],{latitude:33.84,longitude:132.76},500,now)).toHaveLength(0);
    expect(evaluateNotifications([base],{latitude:34,longitude:133},500,now)).toHaveLength(0);
    expect(evaluateNotifications([base],{latitude:33.84,longitude:132.76},500,new Date("2026-09-24T13:00:00+09:00"))).toHaveLength(0);
  });
  it("uses the enforcement id and active window as the duplicate key",()=>{
    const key=notificationKey(base); const receipts={has:(value:string)=>value===key};
    expect(evaluateNotifications([base],{latitude:33.84,longitude:132.76},500,new Date("2026-09-24T11:00:00+09:00"),receipts)[0].alreadyNotified).toBe(true);
  });
  it("groups area alerts by published area and active window without distance",()=>{
    const area={...base,id:"area-1",locationPrecision:"area_only" as const,notificationEligible:false,areaAlertEligible:true,areaKey:"高知:police_district:高知署管内",areaLabel:"高知署管内"};
    const duplicate={...area,id:"area-2",category:"携帯電話"};
    const matches=evaluateAreaAlerts([area,duplicate],area.areaKey,new Date("2026-09-24T11:00:00+09:00"));
    expect(matches).toHaveLength(1);expect(matches[0].records).toHaveLength(2);
    const receipts={has:(key:string)=>key===matches[0].notificationKey};
    expect(evaluateAreaAlerts([area],area.areaKey,new Date("2026-09-24T11:00:00+09:00"),receipts)[0].alreadyNotified).toBe(true);
  });
});
