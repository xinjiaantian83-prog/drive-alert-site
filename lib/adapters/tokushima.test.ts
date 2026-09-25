import { describe,expect,it } from "vitest";
import { parseTokushima } from "./tokushima";
import { sources } from "../sources";
describe("徳島HTML",()=>{it("表を共通形式にする",()=>{const html='<h2>【9月】</h2><table><tr><td>1</td><td>火</td><td>午前</td><td>徳島市津田町</td><td>県道徳島インター線</td><td>携帯・ベルト</td></tr></table>';const result=parseTokushima(html,sources[3],2026);expect(result[0]).toMatchObject({date:"2026-09-01",location:"徳島市津田町",locationPrecision:"approximate",status:"confirmed"});});});
