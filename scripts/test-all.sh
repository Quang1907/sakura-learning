#!/usr/bin/env bash
set -e

echo "🌸 Running Sakura Comprehensive Test & Quality Gate..."

echo "1. Type Checking..."
npm run type-check

echo "2. Linting..."
npm run lint

echo "3. Vitest Test Suite..."
npm test

echo "✅ All tests and verification checks passed!"
