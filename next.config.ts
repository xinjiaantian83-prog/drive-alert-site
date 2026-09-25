import type { NextConfig } from "next";
const staticExport=process.env.STATIC_EXPORT==="1";
const nextConfig: NextConfig = { output:staticExport?"export":"standalone", trailingSlash:staticExport, images:{unoptimized:true} };
export default nextConfig;
