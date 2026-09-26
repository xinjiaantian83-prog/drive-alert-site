import { describe,expect,it } from "vitest";
import { sourceCatalog } from "./source-catalog";
import { PREFECTURES } from "./types";
describe("source catalog",()=>{it("covers all 47 prefectures exactly once",()=>{expect(sourceCatalog).toHaveLength(47);expect(new Set(sourceCatalog.map(v=>v.prefecture)).size).toBe(47);expect(sourceCatalog.map(v=>v.prefecture)).toEqual([...PREFECTURES]);});it("provides an HTTPS official source for every prefecture",()=>{for(const source of sourceCatalog)expect(source.officialUrl,source.prefecture).toMatch(/^https:\/\//);});});
