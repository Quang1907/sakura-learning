#!/usr/bin/env bash
set -e

echo "🌸 Building Sakura Monorepo Production Packages..."

npm run build
echo "✅ Build completed successfully for shared, api, web, and admin."
