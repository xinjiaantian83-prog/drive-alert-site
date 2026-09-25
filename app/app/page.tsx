import Dashboard from "@/components/Dashboard";import {sources} from "@/lib/sources";import {getAllRecords,getRawSourceCount} from "@/lib/db";
export const dynamic="force-static";export const metadata={title:"Web版プレビュー",robots:{index:false,follow:false}};
export default function AppPreview(){return <Dashboard initialRecords={getAllRecords()} sources={sources} rawSourceCount={getRawSourceCount()}/>}
