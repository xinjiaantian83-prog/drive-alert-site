import type {Prefecture,SourceCatalogEntry} from "./types";

type Pattern=NonNullable<SourceCatalogEntry["discoveryPattern"]>;
const groups:Record<Pattern,readonly Prefecture[]>={
  structured_data:["大分"],
  two_step_station_document:["静岡","京都"],
  document_index:["青森","山形","福島","茨城","埼玉","千葉","新潟","石川","福井","愛知","三重","大阪","兵庫","奈良","和歌山","山口","鹿児島"],
  direct_document:["岩手","秋田","鳥取","福岡","佐賀"],
  direct_html:["北海道","宮城","栃木","群馬","東京","神奈川","長野","岐阜","富山","滋賀","島根","広島","徳島","香川","長崎","宮崎","熊本"],
  web_map:["岡山"],
  special:["高知","愛媛"],
  unconfirmed:["山梨","沖縄"]
};
const priority:Record<Pattern,number>={two_step_station_document:1,document_index:2,direct_document:2,structured_data:3,web_map:4,direct_html:5,special:6,unconfirmed:7};
export function classifyCatalogEntry(entry:SourceCatalogEntry):SourceCatalogEntry{
  const pattern=(Object.entries(groups).find(([,values])=>values.includes(entry.prefecture))?.[0]??"unconfirmed") as Pattern;
  const reason=entry.status==="active"?null:entry.unimplementedReason??(entry.status==="official_source_not_confirmed"?"日付・場所を伴う公式公開情報源を確認できていません":pattern==="two_step_station_document"?"警察署一覧から各署ページを経由してPDFを収集し、署ごとの差がある表を安全に解析する必要があります":pattern==="web_map"?"公開Webマップの公式JSON・GeoJSON・APIエンドポイントを特定する必要があります":entry.publication==="policy_only"?"日付または有効期間を伴う公開取締り情報を確認できていません":`${pattern==="document_index"||pattern==="direct_document"?"PDF":"公開ページ"}の共通解析ルールが未実装です`);
  return {...entry,discoveryPattern:pattern,implementationPriority:priority[pattern],unimplementedReason:reason};
}
