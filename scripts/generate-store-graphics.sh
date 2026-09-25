#!/bin/zsh
set -euo pipefail

ROOT_DIR=${0:A:h:h}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SOURCE="$ROOT_DIR/store-assets/android/feature-graphic.svg"
OUTPUT="$ROOT_DIR/store-assets/android/feature-graphic.png"

"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1024,500 --screenshot="$OUTPUT" "file://$SOURCE"
sips -g pixelWidth -g pixelHeight -g hasAlpha "$OUTPUT"
