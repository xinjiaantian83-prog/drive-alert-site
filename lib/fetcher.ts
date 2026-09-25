import { createHash } from "node:crypto";
export async function fetchOfficial(url: string) {
  const response = await fetch(url, { headers: { "user-agent": process.env.USER_AGENT ?? "ShikokuTrafficWatch/0.1" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, text: bytes.toString("utf8"), hash: createHash("sha256").update(bytes).digest("hex"), etag: response.headers.get("etag"), contentType: response.headers.get("content-type") };
}
