import {describe,expect,it} from "vitest";
import {parseKochiPages} from "./kochi";
import {sources} from "../sources";
describe("高知PDF",()=>{it("座標付き文字を署別マトリクスへ変換する",()=>{const item=(str:string,x:number,y:number)=>({str,transform:[1,0,0,1,x,y]});const page=[item("９月",240,770),item("１",100,561),item("午前",119,594),..."歩行者妨害".split("").map((s,i)=>item(s,152.4,617-i*11.2))];const rows=parseKochiPages([page],sources[2],"https://example.test/kochi.pdf",2026);expect(rows[0]).toMatchObject({date:"2026-09-01",timeLabel:"午前",policeStation:"高知署",category:"歩行者妨害",locationPrecision:"area_only"});});});
