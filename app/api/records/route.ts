import { getAllRecords } from "@/lib/db";

export const dynamic="force-static";
export async function GET(){
  const records=getAllRecords();
  const generatedAt=records.reduce((latest,record)=>record.updatedAt&&record.updatedAt>latest?record.updatedAt:latest,new Date(0).toISOString());
  const etag=`W/\"${generatedAt}-${records.length}\"`;
  return Response.json({generatedAt,records},{headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=3600",ETag:etag}});
}
