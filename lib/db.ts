import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { EnforcementRecord, LocationPrecision } from "./types";

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "traffic.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS source_snapshots (
    id TEXT PRIMARY KEY, source_id TEXT NOT NULL, url TEXT NOT NULL,
    content_hash TEXT NOT NULL, http_etag TEXT, fetched_at TEXT NOT NULL,
    parse_status TEXT NOT NULL, error TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_snapshots_source_time ON source_snapshots(source_id, fetched_at DESC);
  CREATE TABLE IF NOT EXISTS raw_sources (
    id TEXT PRIMARY KEY, source_id TEXT NOT NULL, url TEXT NOT NULL,
    fetched_at TEXT NOT NULL, sha256 TEXT NOT NULL, content_type TEXT,
    extracted_text TEXT NOT NULL, parser_version TEXT NOT NULL, content_blob BLOB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_raw_source_time ON raw_sources(source_id, fetched_at DESC);
  CREATE TABLE IF NOT EXISTS geocode_cache (
    query TEXT PRIMARY KEY, latitude REAL NOT NULL, longitude REAL NOT NULL,
    result_title TEXT NOT NULL, verified INTEGER NOT NULL, fetched_at TEXT NOT NULL
  );
`);

const enforcementExists=db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='enforcements'").get();
if(!enforcementExists) db.exec(`CREATE TABLE enforcements (
  id TEXT PRIMARY KEY, prefecture TEXT NOT NULL, date TEXT, time_label TEXT,
  start_time TEXT, end_time TEXT, location TEXT, route TEXT, category TEXT,
  police_station TEXT, latitude REAL, longitude REAL, source_url TEXT NOT NULL,
  source_title TEXT NOT NULL, status TEXT NOT NULL, review_reason TEXT,
  raw_text TEXT NOT NULL, snapshot_id TEXT NOT NULL, updated_at TEXT NOT NULL,
  location_precision TEXT NOT NULL DEFAULT 'unresolved', raw_source_id TEXT
)`);
function ensureColumn(table:string,column:string,definition:string){
  const columns=db.prepare(`PRAGMA table_info(${table})`).all() as Array<{name:string}>;
  if(!columns.some(c=>c.name===column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
ensureColumn("enforcements","location_precision","TEXT NOT NULL DEFAULT 'unresolved'");
ensureColumn("enforcements","raw_source_id","TEXT");
ensureColumn("enforcements","coordinate_source","TEXT");
ensureColumn("enforcements","coordinate_verified","INTEGER NOT NULL DEFAULT 0");
ensureColumn("enforcements","active_from","TEXT");
ensureColumn("enforcements","active_to","TEXT");
ensureColumn("enforcements","notification_eligible","INTEGER NOT NULL DEFAULT 0");
ensureColumn("enforcements","area_alert_eligible","INTEGER NOT NULL DEFAULT 0");
ensureColumn("enforcements","area_scope_type","TEXT");
ensureColumn("enforcements","area_key","TEXT");
ensureColumn("enforcements","area_label","TEXT");
ensureColumn("source_snapshots","parser_version","TEXT");
db.exec("CREATE INDEX IF NOT EXISTS idx_enforcement_pref_date ON enforcements(prefecture, date)");

export function findLatestSnapshot(sourceId: string) {
  return db.prepare("SELECT content_hash AS contentHash, parser_version AS parserVersion FROM source_snapshots WHERE source_id = ? AND parse_status='parsed' ORDER BY fetched_at DESC LIMIT 1").get(sourceId) as { contentHash:string;parserVersion:string|null } | undefined;
}
export function createSnapshot(input:{sourceId:string;url:string;contentHash:string;httpEtag:string|null;parseStatus:string;error:string|null;parserVersion:string}) {
  const id=randomUUID();
  db.prepare("INSERT INTO source_snapshots (id,source_id,url,content_hash,http_etag,fetched_at,parse_status,error,parser_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id,input.sourceId,input.url,input.contentHash,input.httpEtag,new Date().toISOString(),input.parseStatus,input.error,input.parserVersion);
  return id;
}
export function saveRawSource(input:{sourceId:string;url:string;sha256:string;contentType:string|null;extractedText:string;parserVersion:string;bytes:Buffer}){
  const id=randomUUID(); db.prepare("INSERT INTO raw_sources VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id,input.sourceId,input.url,new Date().toISOString(),input.sha256,input.contentType,input.extractedText,input.parserVersion,input.bytes); return id;
}
export function upsertRecord(r: EnforcementRecord, snapshotId:string, rawSourceId:string|null) {
  db.prepare(`INSERT INTO enforcements (id,prefecture,date,time_label,start_time,end_time,location,route,category,police_station,latitude,longitude,source_url,source_title,status,review_reason,raw_text,snapshot_id,updated_at,location_precision,raw_source_id,coordinate_source,coordinate_verified,active_from,active_to,notification_eligible,area_alert_eligible,area_scope_type,area_key,area_label)
    VALUES (${Array(30).fill("?").join(",")}) ON CONFLICT(id) DO UPDATE SET prefecture=excluded.prefecture,date=excluded.date,time_label=excluded.time_label,start_time=excluded.start_time,end_time=excluded.end_time,location=excluded.location,route=excluded.route,category=excluded.category,police_station=excluded.police_station,latitude=excluded.latitude,longitude=excluded.longitude,source_url=excluded.source_url,source_title=excluded.source_title,status=excluded.status,review_reason=excluded.review_reason,raw_text=excluded.raw_text,snapshot_id=excluded.snapshot_id,updated_at=excluded.updated_at,location_precision=excluded.location_precision,raw_source_id=excluded.raw_source_id,coordinate_source=excluded.coordinate_source,coordinate_verified=excluded.coordinate_verified,active_from=excluded.active_from,active_to=excluded.active_to,notification_eligible=excluded.notification_eligible,area_alert_eligible=excluded.area_alert_eligible,area_scope_type=excluded.area_scope_type,area_key=excluded.area_key,area_label=excluded.area_label`).run(r.id,r.prefecture,r.date,r.timeLabel,r.startTime,r.endTime,r.location,r.route,r.category,r.policeStation,r.latitude,r.longitude,r.sourceUrl,r.sourceTitle,r.status,r.reviewReason,r.rawText,snapshotId,new Date().toISOString(),r.locationPrecision,rawSourceId,r.coordinateSource??null,r.coordinateVerified?1:0,r.activeFrom??null,r.activeTo??null,r.notificationEligible?1:0,r.areaAlertEligible?1:0,r.areaScopeType??null,r.areaKey??null,r.areaLabel??null);
}
export function replacePrefectureRecords(prefecture:EnforcementRecord["prefecture"],records:Array<{record:EnforcementRecord;rawSourceId:string}>,snapshotId:string){
  db.exec("BEGIN IMMEDIATE");try{db.prepare("DELETE FROM enforcements WHERE prefecture=?").run(prefecture);for(const item of records)upsertRecord(item.record,snapshotId,item.rawSourceId);db.exec("COMMIT");}catch(error){db.exec("ROLLBACK");throw error;}
}
export function getAllRecords():EnforcementRecord[]{
  const rows=db.prepare(`SELECT id,prefecture,date,time_label AS timeLabel,start_time AS startTime,end_time AS endTime,location,route,category,police_station AS policeStation,latitude,longitude,source_url AS sourceUrl,source_title AS sourceTitle,status,review_reason AS reviewReason,raw_text AS rawText,location_precision AS locationPrecision,coordinate_source AS coordinateSource,coordinate_verified AS coordinateVerified,active_from AS activeFrom,active_to AS activeTo,notification_eligible AS notificationEligible,area_alert_eligible AS areaAlertEligible,area_scope_type AS areaScopeType,area_key AS areaKey,area_label AS areaLabel,updated_at AS updatedAt FROM enforcements ORDER BY date ASC,prefecture ASC,time_label ASC`).all();
  return rows.map(r=>({...r,locationPrecision:(r as {locationPrecision:LocationPrecision}).locationPrecision,coordinateVerified:Boolean((r as {coordinateVerified:number}).coordinateVerified),notificationEligible:Boolean((r as {notificationEligible:number}).notificationEligible),areaAlertEligible:Boolean((r as {areaAlertEligible:number}).areaAlertEligible)})) as EnforcementRecord[];
}
export function getRawSourceCount(){return Number((db.prepare("SELECT COUNT(*) AS count FROM raw_sources").get() as {count:number}).count);}
export function getGeocodeCache(query:string){const row=db.prepare("SELECT latitude,longitude,result_title AS resultTitle,verified FROM geocode_cache WHERE query=?").get(query) as {latitude:number;longitude:number;resultTitle:string;verified:number}|undefined;return row?{...row,verified:Boolean(row.verified)}:undefined;}
export function saveGeocodeCache(query:string,value:{latitude:number;longitude:number;resultTitle:string;verified:boolean}){db.prepare("INSERT OR REPLACE INTO geocode_cache VALUES (?,?,?,?,?,?)").run(query,value.latitude,value.longitude,value.resultTitle,value.verified?1:0,new Date().toISOString());}
