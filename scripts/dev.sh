#!/usr/bin/env bash
set -e

echo "🌸 Starting Sakura Full-stack in Development Mode..."

# Build shared types & schemas first
npm --workspace=@sakura/shared run build

# Start API in watch mode
npm --workspace=@sakura/api run dev
