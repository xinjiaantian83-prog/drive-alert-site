import { describe,expect,it } from "vitest";
import { canUseFeature,isInDateScope } from "./entitlements";

describe("plan entitlements",()=>{
  it("keeps notification and nationwide features Pro-only",()=>{
    expect(canUseFeature("free","proximity_notifications")).toBe(false);
    expect(canUseFeature("free","area_alerts")).toBe(false);
    expect(canUseFeature("pro","notification_history")).toBe(true);
  });
  it("limits free browsing to today or the next seven days",()=>{
    const now=new Date("2026-09-24T12:00:00+09:00");
    expect(isInDateScope({date:"2026-09-24"},"today",now)).toBe(true);
    expect(isInDateScope({date:"2026-09-30"},"week",now)).toBe(true);
    expect(isInDateScope({date:"2026-10-01"},"week",now)).toBe(false);
  });
});
