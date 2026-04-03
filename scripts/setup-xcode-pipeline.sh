#!/bin/zsh
# CostcoDogs — Xcode publishing pipeline setup
# Run this once from Terminal.app: bash scripts/setup-xcode-pipeline.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"
echo "\n=== CostcoDogs Xcode Pipeline ===\n"

# ── 1. Homebrew ──────────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "▶ Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon Macs
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  fi
else
  echo "✓ Homebrew already installed ($(brew --version | head -1))"
fi

# ── 2. Node.js ───────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "▶ Installing Node.js..."
  brew install node
else
  echo "✓ Node already installed ($(node --version))"
fi

# ── 3. CocoaPods ─────────────────────────────────────────────────────────────
if ! command -v pod &>/dev/null; then
  echo "▶ Installing CocoaPods..."
  brew install cocoapods
else
  echo "✓ CocoaPods already installed ($(pod --version))"
fi

# ── 4. EAS CLI ───────────────────────────────────────────────────────────────
if ! command -v eas &>/dev/null; then
  echo "▶ Installing EAS CLI..."
  npm install -g eas-cli
else
  echo "✓ EAS CLI already installed ($(eas --version))"
fi

# ── 5. JS dependencies ───────────────────────────────────────────────────────
echo "▶ Installing JS dependencies..."
npm install

# ── 6. Expo prebuild (generates ios/ Xcode project) ──────────────────────────
echo "▶ Running expo prebuild..."
npx expo prebuild --platform ios --clean

# ── 7. CocoaPods install ─────────────────────────────────────────────────────
echo "▶ Running pod install..."
cd ios
pod install
cd ..

# ── 8. Open in Xcode ─────────────────────────────────────────────────────────
echo "\n✅ Done! Opening project in Xcode...\n"
open ios/CostcoDogs.xcworkspace

echo "Next steps in Xcode:"
echo "  1. Click the CostcoDogs project → Signing & Capabilities"
echo "  2. Enable 'Automatically manage signing'"
echo "  3. Set Team to your Apple Developer account"
echo "  4. Product → Destination → Any iOS Device (arm64)"
echo "  5. Product → Archive → Distribute App → App Store Connect → Upload"
