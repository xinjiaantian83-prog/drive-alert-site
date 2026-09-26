import {SiteFooter,SiteHeader} from "@/components/Marketing";
import {sourceCatalog} from "@/lib/source-catalog";

export const metadata={title:"公式情報源",description:"ドライブアラートが参照する47都道府県の警察・行政公式サイト一覧",alternates:{canonical:"https://drive-alert.jp/sources"}};

export default function SourcesPage(){return <><SiteHeader/><main className="contentPage"><header className="pageHero"><span>OFFICIAL SOURCES</span><h1>公式情報源</h1><p>ドライブアラートが交通取締り情報の確認に使用する、47都道府県の警察・行政公式サイトです。</p></header><aside className="sourceDisclaimer"><b>本サービスは警察・自治体等の公式アプリではありません。</b><p>各機関との提携・承認・推薦を示すものではありません。掲載情報は公式サイトの内容を整理したもので、必ず各レコードの「公式出典」から原文もご確認ください。</p></aside><section className="officialSourceGrid" aria-label="47都道府県の公式情報源">{sourceCatalog.map(source=><article key={source.prefecture}><div><b>{source.prefecture}</b><span>警察・行政公式サイト</span></div><a href={source.officialUrl!} target="_blank" rel="noreferrer">公式情報源を開く ↗</a></article>)}</section><p className="finePrint">公式サイトの公開内容・URLは変更されることがあります。本一覧は情報源の確認用であり、リンク先機関が本サービスを運営または承認していることを意味しません。各レコードに付けた個別の公式出典リンクも引き続き表示します。</p></main><SiteFooter/></>}
