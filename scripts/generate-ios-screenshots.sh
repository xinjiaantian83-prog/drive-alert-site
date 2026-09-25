#!/bin/zsh
set -euo pipefail

ROOT_DIR=${0:A:h:h}
DEVICE_NAME="iPhone 17 Pro Max"
OUTPUT_DIR="$ROOT_DIR/store-assets/ios/6.9-inch"
DERIVED_DIR="$ROOT_DIR/ios/build-screenshots"
BUNDLE_ID="jp.co.officialtraffic.watch"

mkdir -p "$OUTPUT_DIR"
xcodebuild -project "$ROOT_DIR/ios/OfficialTrafficWatch.xcodeproj" -scheme OfficialTrafficWatch -configuration Debug -sdk iphonesimulator -destination "platform=iOS Simulator,name=$DEVICE_NAME" -derivedDataPath "$DERIVED_DIR" CODE_SIGNING_ALLOWED=NO build

DEVICE_ID=$(xcrun simctl list devices available | grep "$DEVICE_NAME" | head -1 | sed -E 's/.*\(([0-9A-F-]{36})\).*/\1/')
if [[ -z "$DEVICE_ID" ]]; then
  print -u2 "Simulator not found: $DEVICE_NAME"
  exit 1
fi
xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
open -a Simulator
xcrun simctl bootstatus "$DEVICE_ID" -b
xcrun simctl install "$DEVICE_ID" "$DERIVED_DIR/Build/Products/Debug-iphonesimulator/OfficialTrafficWatch.app"

for scene in onboarding list map paywall notifications; do
  xcrun simctl terminate "$DEVICE_ID" "$BUNDLE_ID" 2>/dev/null || true
  SIMCTL_CHILD_SCREENSHOT_SCENE="$scene" xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID"
  sleep 3
  xcrun simctl io "$DEVICE_ID" screenshot "$OUTPUT_DIR/${scene}.png"
  sips -s format jpeg -s formatOptions 95 "$OUTPUT_DIR/${scene}.png" --out "$OUTPUT_DIR/${scene}.jpg" >/dev/null
done

print "Generated iOS screenshots in $OUTPUT_DIR"
