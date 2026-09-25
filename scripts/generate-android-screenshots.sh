#!/bin/zsh
set -euo pipefail

ROOT_DIR=${0:A:h:h}
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
OUTPUT_DIR="$ROOT_DIR/store-assets/android/phone"
PACKAGE="jp.co.officialtraffic.watch"
ACTIVITY="$PACKAGE/.MainActivity"

mkdir -p "$OUTPUT_DIR"
if ! "$ADB" get-state >/dev/null 2>&1; then
  print -u2 "Android Emulatorまたは実機を起動してから再実行してください。"
  exit 2
fi

cd "$ROOT_DIR/android"
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:assembleDebug
"$ADB" install -r "$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"

for scene in free pro; do
  "$ADB" shell am force-stop "$PACKAGE"
  "$ADB" shell am start -n "$ACTIVITY" --es screenshot_scene "$scene"
  sleep 3
  "$ADB" exec-out screencap -p > "$OUTPUT_DIR/${scene}.png"
done

print "Generated Android screenshots in $OUTPUT_DIR"
