import { z } from "zod";

export const PREFECTURES = ["北海道","青森","岩手","宮城","秋田","山形","福島","茨城","栃木","群馬","埼玉","千葉","東京","神奈川","新潟","富山","石川","福井","山梨","長野","岐阜","静岡","愛知","三重","滋賀","京都","大阪","兵庫","奈良","和歌山","鳥取","島根","岡山","広島","山口","徳島","香川","愛媛","高知","福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄"] as const;
export type Prefecture = typeof PREFECTURES[number];

export const recordSchema = z.object({
  id: z.string(),
  prefecture: z.enum(PREFECTURES),
  date: z.string().nullable(),
  timeLabel: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  location: z.string().nullable(),
  route: z.string().nullable(),
  category: z.string().nullable(),
  policeStation: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  locationPrecision: z.enum(["exact", "approximate", "area_only", "unresolved"]),
  coordinateSource: z.string().nullable().optional(),
  coordinateVerified: z.boolean().optional(),
  activeFrom: z.string().nullable().optional(),
  activeTo: z.string().nullable().optional(),
  notificationEligible: z.boolean().optional(),
  areaAlertEligible: z.boolean().optional(),
  areaScopeType: z.enum(["municipality", "police_district", "route", "published_area"]).nullable().optional(),
  areaKey: z.string().nullable().optional(),
  areaLabel: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
  sourceUrl: z.string().url(),
  sourceTitle: z.string(),
  status: z.enum(["confirmed", "needs_review"]),
  reviewReason: z.string().nullable(),
  rawText: z.string()
});
export type EnforcementRecord = z.infer<typeof recordSchema>;
export type LocationPrecision = EnforcementRecord["locationPrecision"];

export type SourceDefinition = {
  id: string;
  prefecture: EnforcementRecord["prefecture"];
  title: string;
  indexUrl: string;
  format: "html" | "pdf-index" | "csv-index";
  adapter: "tokushima-table" | "kagawa-list" | "kochi-pdf" | "ehime-pdf-index" | "generic-html-table" | "generic-html-linked-table" | "generic-csv-index" | "monthly-pdf-index" | "priority-guidance-pdf-index" | "regional-schedule-pdf-index" | "coordinate-triplet-pdf-index" | "coordinate-schedule-pdf-index" | "coordinate-grid-pdf-index" | "miyagi-time-grid" | "kanagawa-monthly-list" | "tochigi-heading-schedule" | "tokyo-priority-csv" | "fukuoka-statewide-plan" | "nagasaki-monthly-plan";
  coordinateScheduleLayout?: "chiba_two_period" | "saitama_statewide";
  coordinateGridLayout?: "fukui_daily_rows" | "kagoshima_area_matrix" | "yamagata_calendar_cells" | "yamaguchi_route_time_matrix" | "niigata_two_column_daily" | "wakayama_three_area_daily" | "saga_station_symbol_matrix" | "iwate_daily_cards" | "akita_three_period_daily";
  pdfLinkIncludes?: string;
  regionLabels?: string[];
  linkedHtmlLabelPattern?: string;
};

export type SourceCatalogEntry = {
  prefecture: Prefecture;
  status: "active" | "confirmed_unimplemented" | "official_source_not_confirmed";
  officialUrl: string | null;
  publication: "dated_locations" | "priority_areas" | "policy_only" | "unknown";
  adapterFamily: "html_table" | "html_sections" | "csv_index" | "pdf_index" | "pdf_document" | "custom" | null;
  notes: string;
  discoveryPattern?: "direct_html" | "direct_document" | "document_index" | "two_step_station_document" | "structured_data" | "web_map" | "special" | "unconfirmed";
  implementationPriority?: number;
  unimplementedReason?: string | null;
};
