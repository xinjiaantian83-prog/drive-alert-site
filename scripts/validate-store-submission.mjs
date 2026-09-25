import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const read=(path)=>fs.readFileSync(root+path,"utf8");
const checks=[];
const check=(name,value,detail="")=>checks.push({name,value,detail});
const expected={
  bundle:"jp.co.officialtraffic.watch",
  product:"jp.co.officialtraffic.watch.pro.yearly",
  appName:"ドライブアラート",
  domain:"https://drive-alert.jp",
  email:"support@drive-alert.jp",
  version:"1.0.0",
  build:"1",
  androidBuild:"2",
  price:"1,480円"
};

const iosProject=read("ios/project.yml");
const iosInfo=read("ios/OfficialTrafficWatch/Info.plist");
const androidGradle=read("android/app/build.gradle");
const paywall=read("ios/OfficialTrafficWatch/PaywallView.swift");
const privacy=read("app/privacy/page.tsx");
const support=read("app/support/page.tsx");
check("iOS Bundle ID",iosProject.includes(expected.bundle),expected.bundle);
check("Android applicationId",androidGradle.includes(expected.bundle),expected.bundle);
check("StoreKit Product ID",iosInfo.includes(expected.product),expected.product);
check("Google Play Product ID",read("android/app/src/main/java/jp/co/officialtraffic/watch/EntitlementManager.java").includes(expected.product),expected.product);
check("iOS version",iosProject.includes('MARKETING_VERSION: "'+expected.version+'"'),expected.version);
check("Android version",androidGradle.includes("versionName '"+expected.version+"'"),expected.version);
check("iOS build",iosProject.includes('CURRENT_PROJECT_VERSION: "'+expected.build+'"'),expected.build);
check("Android versionCode",androidGradle.includes("versionCode "+expected.androidBuild),expected.androidBuild);
check("価格表記",paywall.includes(expected.price),expected.price);
check("iOS表示名",iosProject.includes("CFBundleDisplayName: "+expected.appName),expected.appName);
check("Android表示名",read("android/app/src/main/AndroidManifest.xml").includes('android:label="'+expected.appName+'"'),expected.appName);
check("Web名称",read("app/layout.tsx").includes(expected.appName),expected.appName);
check("Privacy URL",privacy.includes(expected.domain)&&privacy.includes(expected.email),expected.domain+"/privacy");
check("Support URL",support.includes(expected.email),expected.domain+"/support");
check("非公式表記",privacy.includes("公式アプリではありません"),"Privacy");
check("公式情報整理",privacy.includes("公式公開している情報を整理"),"Privacy");
check("非網羅表記",privacy.includes("すべての取締り情報を網羅"),"Privacy");
check("公開粒度差",privacy.includes("公開内容・期間・場所の粒度が異なります"),"Privacy");
check("購入復元案内",support.includes("購入を復元"),"Support");
check("iOS Privacy Manifest",fs.existsSync(root+"ios/OfficialTrafficWatch/Resources/PrivacyInfo.xcprivacy"));
check("Android AAB",fs.existsSync(root+"release-artifacts/OfficialTrafficWatch-android-1.0.0.aab"));
check("Feature graphic",fs.existsSync(root+"store-assets/android/feature-graphic.png"),"1024x500");
for(const name of ["onboarding","list","map","paywall","notifications"])check("iOS screenshot "+name,fs.existsSync(root+"store-assets/ios/6.9-inch/"+name+".jpg"),"1320x2868 JPEG");
const iosHash=execFileSync("shasum",["-a","256",root+"ios/OfficialTrafficWatch/Resources/enforcements.json"],{encoding:"utf8"}).split(" ")[0];
const androidHash=execFileSync("shasum",["-a","256",root+"android/app/src/main/assets/enforcements.json"],{encoding:"utf8"}).split(" ")[0];
check("iOS/Androidデータ一致",iosHash===androidHash,iosHash);

for(const item of checks)console.log((item.value?"PASS":"FAIL")+" | "+item.name+(item.detail?" | "+item.detail:""));
if(checks.some(item=>!item.value))process.exitCode=1;
