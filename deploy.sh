#!/bin/bash
set -euo pipefail

usage() {
  echo "Usage: ./deploy.sh [api|web]"
  echo ""
  echo "  api   Deploy the Express backend to Vercel"
  echo "  web   Deploy the React frontend to Vercel"
  exit 1
}

[ $# -eq 0 ] && usage

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

case "$1" in
  api)
    echo "==> Deploying API..."
    cp vercel/api.json vercel.json
    rm -rf .vercel
    vercel link --yes --project ku-food-hunt-api
    vercel env add DATABASE_URL production --yes < /dev/null  # set manually if needed
    vercel deploy --yes --prod
    rm -f vercel.json
    echo "==> API deployed to https://ku-food-hunt-api.vercel.app"
    ;;
  web)
    echo "==> Deploying Web..."
    cp vercel/web.json vercel.json
    rm -rf .vercel
    vercel link --yes --project ku-food-hunt-web
    vercel env add VITE_API_URL production --yes <<< 'https://ku-food-hunt-api.vercel.app'
    vercel deploy --yes --prod
    rm -f vercel.json
    echo "==> Web deployed to https://ku-food-hunt-web.vercel.app"
    ;;
  *)
    usage
    ;;
esac

rm -rf .vercel
