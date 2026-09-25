import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {getAllRecords} from "../lib/db";
import {cloudPayload} from "../lib/cloud-api";

const now=new Date();
const payload=cloudPayload(getAllRecords(),now),body=JSON.stringify(payload,null,2);
const directory=join(process.cwd(),"public","api","v1");
mkdirSync(directory,{recursive:true});
writeFileSync(join(directory,"records.json"),body);
writeFileSync(join(directory,"status.json"),JSON.stringify({schemaVersion:1,generatedAt:payload.generatedAt,staleAfter:payload.staleAfter,recordCount:payload.records.length,sha256:createHash("sha256").update(body).digest("hex")},null,2));
console.log(`Cloud API: ${payload.records.length} active/non-expiring records, stale after ${payload.staleAfter}`);
