#!/usr/bin/env bash
# Beeliber 배포 스크립트
# 실행: ./deploy.sh
# DB 마이그레이션 → 클라이언트 빌드 → Firebase 배포를 순서대로 실행

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== [1/3] Supabase DB 마이그레이션 ==="
supabase db push
echo ""

echo "=== [2/3] 클라이언트 빌드 ==="
cd "$ROOT_DIR/client"
npm run build
cd "$ROOT_DIR"
echo ""

echo "=== [3/3] Firebase 배포 ==="
firebase deploy --only hosting
echo ""

echo "✓ 배포 완료"
