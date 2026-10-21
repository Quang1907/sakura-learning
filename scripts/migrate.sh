#!/usr/bin/env bash
set -e

echo "🌸 Running Sakura Database Migrations..."

npm --workspace=@sakura/api run db:migrate
echo "✅ Migrations and initial seeds applied."
