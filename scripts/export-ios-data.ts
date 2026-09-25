import { mkdirSync,writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAllRecords } from "../lib/db";

const output=join(process.cwd(),"ios","OfficialTrafficWatch","Resources","enforcements.json");
const androidOutput=join(process.cwd(),"android","app","src","main","assets","enforcements.json");
mkdirSync(join(process.cwd(),"ios","OfficialTrafficWatch","Resources"),{recursive:true});
mkdirSync(join(process.cwd(),"android","app","src","main","assets"),{recursive:true});
const now=new Date();
const payload=JSON.stringify({schemaVersion:1,generatedAt:now.toISOString(),staleAfter:new Date(now.getTime()+30*24*60*60*1000).toISOString(),records:getAllRecords()},null,2);
writeFileSync(output,payload);writeFileSync(androidOutput,payload);
console.log(`Exported ${getAllRecords().length} records to ${output} and ${androidOutput}`);
