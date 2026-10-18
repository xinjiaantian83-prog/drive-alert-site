import {createHash,createPublicKey,verify} from "node:crypto";
import {readFileSync} from "node:fs";

const body=readFileSync("public/api/v1/records.json");
const payload=JSON.parse(body);
const signature=JSON.parse(readFileSync("public/api/v1/records.sig.json","utf8"));
const status=JSON.parse(readFileSync("public/api/v1/status.json","utf8"));
const publicKeyDer=Buffer.from("MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbCs4AJr/i23Sy/bzfRGbtKssWDWOEWnJxFDZdMoyAQyXUhsd+p5JDMltMs+KwWJxNXLQ6cr/OuJ8QbH8raGB6g==","base64");
const publicKey=createPublicKey({key:publicKeyDer,format:"der",type:"spki"});
const sha256=createHash("sha256").update(body).digest("hex");

if(payload.schemaVersion!==3||status.schemaVersion!==3)throw new Error("schemaVersion 3 required");
if(signature.algorithm!=="ECDSA_P256_SHA256"||signature.keyId!=="drive-alert-api-2026-01")throw new Error("unexpected signature metadata");
if(!verify("sha256",body,publicKey,Buffer.from(signature.signature,"base64")))throw new Error("invalid API signature");
if(status.sha256!==sha256)throw new Error("status sha256 does not match records.json");
if(status.recordCount!==payload.records?.length||status.sourceCount!==payload.sources?.length)throw new Error("status counts do not match records.json");
if(!Number.isFinite(Date.parse(payload.generatedAt))||!Number.isFinite(Date.parse(payload.staleAfter)))throw new Error("invalid API timestamps");
if(Date.parse(payload.staleAfter)<=Date.parse(payload.generatedAt))throw new Error("API payload is already stale at generation time");

console.log(`Validated signed schema 3 API: ${payload.records.length} records, ${payload.sources.length} sources, ${sha256}`);
