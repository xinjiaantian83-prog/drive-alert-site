# ドライブアラート

警察・自治体の公式公開情報だけを取得し、共通形式で一覧・地図表示する成立性検証です。ユーザー投稿・課金は含みません。通知は開発用シミュレーターとして検証できます。

## 起動

```bash
cp .env.example .env
npm install
npm run dev
```

`http://localhost:3000` を開きます。画面はSQLiteに保存された公式サイトの実データを表示します。

## 取得検証

```bash
npm run sync
```

DBはNode.js標準SQLiteを使い、初回同期時に自動作成されます。愛媛の署別PDF、香川の日別HTML、高知の月次PDF、徳島の月次HTMLを個別パーサーで共通形式へ変換します。解析できない必須項目は推測せず `needs_review` として記録します。

取得したHTML/PDFは `raw_sources` に原本BLOBとともに、URL・取得日時・SHA-256・抽出テキスト・parser versionを保存します。

### location_precision

- `exact`: 公式情報または検証済み座標で地点が確定
- `approximate`: 町域など、通知に利用できる精度の検証済み概算地点
- `area_only`: 警察署管内・市町村代表点。地図表示専用で取締地点ではない
- `unresolved`: 位置を解決できない

将来のジオフェンス候補は、座標を持つ `exact` または十分に信頼できる `approximate` のみに限定します。現在のエリア代表点はすべて `area_only` なので通知対象外です。

住所を公式に掲載している情報は国土地理院住所検索で照合し、返却住所が一致した場合だけ `coordinate_verified=true` の `approximate` にします。`notification_eligible` は、座標付き `exact` またはこの検証済み `approximate` だけがtrueです。

`active_from` / `active_to` は日本時間のISO 8601で保存します。時刻指定がある情報はその時間、午前・午後・夜間等は公表された時間帯の範囲、時間帯もない情報は当日全体を有効期間とします。

## 本番クラウド同期

`.github/workflows/deploy-pages.yml` は毎日03:17（日本時間）にGitHub Actionsで起動し、公式情報の同期、SHA-256差分検知、SQLite正規化、テスト、静的API生成、GitHub Pages配信まで実行します。MacBookやMac miniの常時起動は不要です。

- データAPI: `https://drive-alert.jp/api/v1/records.json`
- 稼働状態: `https://drive-alert.jp/api/v1/status.json`
- 更新間隔: 24時間
- API鮮度期限: 36時間
- 期限切れの `active_to` を持つ情報はAPI配信から自動除外
- パーサー異常・取得失敗時は、都道府県単位で前回正常データを保持
- iOS/Androidは起動時とアプリ稼働中6時間ごとに同期し、失敗時は端末キャッシュ、次に同梱データへフォールバック
- APIの鮮度期限超過時は表示を維持しつつ、接近通知・エリア注意通知を停止

手動で本番と同じ処理を確認する場合は `npm run sync:cloud`、APIだけ再生成する場合は `npm run api:export` を使います。

## ローカル定期同期

`ops/com.shikoku-traffic-watch.sync.plist` はMacのlaunchd用設定で、6時間ごとに同期します。重複起動は `data/sync.lock` で防止します。導入時はplistを `~/Library/LaunchAgents/` にコピーして `launchctl bootstrap` してください（本リポジトリでは自動登録しません）。

同期ログは `data/sync.log` にJSON Linesで保存します。`NO_CHANGE` は再解析なし、`UPDATED` は正常更新、`SYNC_FAILED` / `PARSER_ANOMALY` は既存正常データを保持した失敗です。

`npm run sync` 自体はmacOSに依存しない同期エントリーポイントです。`launchd` はローカル開発用で、本番更新には使用しません。同期処理にUIや通知判定への依存はありません。

## 通知MVP

`lib/notification.ts` はUI・SQLite・OS通知から独立した純粋な判定モジュールです。対象は `notification_eligible=true`、有効期間内、指定半径（500m / 1km / 2km）内の情報だけです。取締りIDと有効期間から重複防止キーを作り、Web MVPではブラウザーのlocalStorageへ通知済みキーを保存します。将来は同じ `NotificationReceiptStore` をiOS/Androidの永続ストアへ差し替えられます。

通知は2種類です。

- 接近通知: `notification_eligible=true` の確定地点または検証済み概算地点を距離判定
- エリア注意: `area_only` を市区町村・警察署管内・路線等の公式公開単位で判定。代表座標との距離は使わず、地点通知として扱わない

エリア注意の重複防止キーは `area_key + active_from + active_to` です。同一地域・同一有効期間の複数取締り情報は1件の注意通知へ集約します。

開発画面の「通知シミュレーター」では任意の緯度・経度・判定日時を指定できます。判定結果には公式出典と最終更新日時を表示し、シミュレーション後に地図を開くと対象地点と半径が強調表示されます。

## iOS

`ios/` にSwiftUIネイティブアプリがあります。WebのSQLite実データは `npm run ios:data` で審査用同梱JSONへ変換し、`npm run ios:generate` でXcodeプロジェクトを生成します。iOSは `https://drive-alert.jp/api/v1/records.json` から更新し、失敗時は端末キャッシュまたは同梱データを表示します。

```bash
npm run ios:data
npm run ios:generate
npm run ios:build
```

Apple Developer / App Store Connect側の提出前作業は `ios/RELEASE_CHECKLIST.md` を参照してください。

## 拡張方針

- `lib/sources.ts`: 県別の公式取得元URL
- `lib/adapters/`: 形式別パーサー。47都道府県対応時はここへ追加
- `SourceSnapshot`: 更新検知、ETag、解析状態
- `raw_sources`: 原本、取得時刻、SHA-256、抽出テキスト、parser version
- `Enforcement`: 日付、時間、場所、路線、種別、警察署、座標、公式出典
- ジオコーディングは誤特定防止のため、町域以上の明確な住所だけを対象にする想定
- 将来の通知・課金は取得処理から分離し、別ジョブ/サービスとして追加

## 公式サイトのGitHub Pages公開

公式サイトはNext.jsの静的書き出しに対応しています。公開前に次を実行します。

```bash
npm ci
npm run test
npx tsc --noEmit
npm run lint
npm run build:static
npm run check:links
```

`main` へのpushで `.github/workflows/deploy-pages.yml` がテスト・型チェック・Lint・静的ビルド・リンク確認を行い、`out/` をGitHub Pagesへ公開します。独自ドメインは `public/CNAME` の `drive-alert.jp` を使用します。GitHubとXserver Domainでの初回設定は `GITHUB_PAGES_RELEASE.md` を参照してください。

App Store URLが確定したら、ビルド時に `NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/...` を設定してください。未設定時は「公開準備中」と表示します。Google Play CTAは公開まで「Android版準備中」です。

## 公式取得元

- 愛媛県警察: https://www.police.pref.ehime.jp/kotsusidou/koukaitorishimari.htm
- 香川県警察: https://www.pref.kagawa.lg.jp/police/kotusido/koutsuu/sidou.html
- 高知県警察: https://www.police.pref.kochi.lg.jp/docs/2023103100093/
- 徳島県警察: https://www.police.pref.tokushima.jp/24kotuanzen/torimarinew/index.html

公式サイトの利用条件・robots.txt・アクセス頻度を確認し、低頻度の定期取得で運用してください。
