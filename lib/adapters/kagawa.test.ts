import {describe,expect,it} from "vitest";
import {parseKagawaDetail,parseKagawaIndex} from "./kagawa";
import {sources} from "../sources";
describe("香川HTML",()=>{it("日別リンクと署管内情報を構造化する",()=>{const index='<div id="tmp_contents"><a href="/001.html">09月18日（金曜日）</a></div>';expect(parseKagawaIndex(index,"https://example.test/base")).toEqual(["https://example.test/001.html"]);const html='<div id="tmp_contents"><h2>9月18日（金曜日)</h2><p>○朝は、高松東・三豊警察署管内において、</p><p>横断歩行者妨害などの交差点関連違反を重点に</p><p>交通指導取締りが行われます。</p></div>';const rows=parseKagawaDetail(html,sources[1],"https://example.test/001.html",2026);expect(rows).toHaveLength(2);expect(rows[0]).toMatchObject({date:"2026-09-18",policeStation:"高松東警察署",locationPrecision:"area_only"});});});
