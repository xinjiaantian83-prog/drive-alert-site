import "./globals.css";
export const metadata = {
  metadataBase:new URL("https://drive-alert.jp"),
  title:{default:"ドライブアラート｜公式公開の交通取締り情報を確認",template:"%s｜ドライブアラート"},
  description:"警察等が公式公開している交通取締り情報を整理。今日・今週の一覧、地図、接近通知、エリア注意を提供する非公式アプリ。Free版あり、Pro年額1,480円。",
  alternates:{canonical:"/"},
  openGraph:{type:"website",locale:"ja_JP",siteName:"ドライブアラート",title:"ドライブアラート｜公式公開の交通取締り情報を確認",description:"場所を特定できる情報は接近通知、広域情報はエリア注意。公式出典とともに確認できます。",url:"https://drive-alert.jp",images:[{url:"/og-image.svg",width:1200,height:630,alt:"ドライブアラート"}]},
  twitter:{card:"summary_large_image",title:"ドライブアラート",description:"警察等の公式公開交通取締り情報を整理・通知する非公式アプリ",images:["/og-image.svg"]},
  robots:{index:true,follow:true},
};
const jsonLd={"@context":"https://schema.org","@type":"SoftwareApplication",name:"ドライブアラート",applicationCategory:"NavigationApplication",operatingSystem:"iOS, Android",description:"警察等が公式公開している交通取締り情報を整理・通知する非公式アプリ",offers:[{"@type":"Offer",name:"Free",price:"0",priceCurrency:"JPY"},{"@type":"Offer",name:"Pro 年額",price:"1480",priceCurrency:"JPY"}],url:"https://drive-alert.jp"};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ja"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/></body></html>; }
