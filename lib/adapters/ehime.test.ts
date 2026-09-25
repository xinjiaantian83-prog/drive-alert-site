import {describe,expect,it} from "vitest";
import {parseEhimeText} from "./ehime";
import {sources} from "../sources";
describe("愛媛PDF",()=>{it("表を住所・路線・時間へ分割する",()=>{const text=`四国中央署\n9月中の公開交通取締り\n日曜日時　間種　別取締場所路線名\n15日土9：00～11：00速度違反四国中央市土居町天満一般県道\n210日木7：00～9：00自転車違反四国中央市三島中央市道\n★注記`;const rows=parseEhimeText(text,sources[0],"https://example.test/1.pdf",2026);expect(rows).toHaveLength(2);expect(rows[0]).toMatchObject({date:"2026-09-05",startTime:"9:00",category:"速度違反",location:"四国中央市土居町天満",route:"一般県道",locationPrecision:"approximate"});});});
