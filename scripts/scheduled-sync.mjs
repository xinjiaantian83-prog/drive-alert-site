import { mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const lock=join(process.cwd(),"data","sync.lock");
try{mkdirSync(lock,{recursive:false});}catch{console.log(JSON.stringify({timestamp:new Date().toISOString(),level:"WARN",event:"SYNC_SKIPPED_LOCKED"}));process.exit(0);}
try{const result=spawnSync("npm",["run","sync"],{cwd:process.cwd(),stdio:"inherit",env:process.env});process.exitCode=result.status??1;}finally{rmSync(lock,{recursive:true,force:true});}
