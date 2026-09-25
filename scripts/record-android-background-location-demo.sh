#!/bin/zsh
set -euo pipefail

ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
PACKAGE="jp.co.officialtraffic.watch"
REMOTE_VIDEO="/sdcard/drive-alert-background-location-demo.mp4"
OUTPUT_VIDEO="${1:-release-artifacts/drive-alert-background-location-demo.mp4}"

"$ADB" wait-for-device
"$ADB" shell pm clear "$PACKAGE"
"$ADB" shell input keyevent KEYCODE_HOME
"$ADB" shell rm -f "$REMOTE_VIDEO"

"$ADB" shell screenrecord --size 1080x2400 --bit-rate 8000000 --time-limit 32 "$REMOTE_VIDEO" &
RECORD_PID=$!

sleep 1
"$ADB" shell am start -n "$PACKAGE/.MainActivity" --es screenshot_scene pro
sleep 2
"$ADB" shell input tap 540 835
sleep 3
"$ADB" shell input tap 890 1485
sleep 2
"$ADB" shell input tap 540 1470
sleep 1
"$ADB" shell input tap 540 1310
sleep 3
"$ADB" shell input tap 890 1485
sleep 2
"$ADB" shell input tap 250 1490
sleep 2
"$ADB" shell input tap 300 1235
sleep 2
"$ADB" shell input tap 540 1235
sleep 1
"$ADB" shell input keyevent KEYCODE_BACK
sleep 1
"$ADB" shell input keyevent KEYCODE_BACK
sleep 1
"$ADB" shell input keyevent KEYCODE_BACK
sleep 2
"$ADB" shell input tap 540 835
sleep 4

wait "$RECORD_PID"
mkdir -p "${OUTPUT_VIDEO:h}"
"$ADB" pull "$REMOTE_VIDEO" "$OUTPUT_VIDEO"
echo "$OUTPUT_VIDEO"
