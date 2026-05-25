#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE_NAME="${1:-astrology-platform-be-05-closed-pilot-readiness.tar.gz}"
ARCHIVE_PATH="$ROOT/archives/$ARCHIVE_NAME"

cd "$ROOT"

echo "Cleaning build artifacts and junk files..."
pnpm clean

JUNK_COUNT=0
while IFS= read -r -d '' file; do
  rm -f "$file"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -name '._*' -type f -print0)

while IFS= read -r -d '' file; do
  rm -f "$file"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -name '*.tsbuildinfo' -type f -print0)

while IFS= read -r -d '' file; do
  rm -f "$file"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -name '.DS_Store' -type f -print0)

while IFS= read -r -d '' file; do
  rm -f "$file"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -name 'next-env.d.ts' -type f -print0)

while IFS= read -r -d '' file; do
  rm -f "$file"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -name '.eslintcache' -type f -print0)

while IFS= read -r -d '' dir; do
  rm -rf "$dir"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -path ./services/.venv -prune -o -name '__pycache__' -type d -print0)

while IFS= read -r -d '' file; do
  rm -f "$file"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -path ./services/.venv -prune -o -name '*.pyc' -type f -print0)

while IFS= read -r -d '' dir; do
  rm -rf "$dir"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -path ./services/.venv -prune -o -name '.pytest_cache' -type d -print0)

while IFS= read -r -d '' dir; do
  rm -rf "$dir"
  JUNK_COUNT=$((JUNK_COUNT + 1))
done < <(find . -path ./node_modules -prune -o -path ./services/.venv -prune -o -name '*.egg-info' -type d -print0)

if find . -path ./node_modules -prune -o -name '._*' -type f -print -quit | grep -q .; then
  echo "Error: AppleDouble files remain after cleanup." >&2
  exit 1
fi

if find . -path ./node_modules -prune -o -name '*.tsbuildinfo' -type f -print -quit | grep -q .; then
  echo "Error: tsbuildinfo files remain after cleanup." >&2
  exit 1
fi

mkdir -p "$ROOT/archives"

echo "Creating archive: $ARCHIVE_PATH"
COPYFILE_DISABLE=1 tar --disable-copyfile --no-xattrs \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.turbo' \
  --exclude='.cache' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.staging' \
  --exclude='.env.production' \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='.pytest_cache' \
  --exclude='.mypy_cache' \
  --exclude='.ruff_cache' \
  --exclude='*.pyc' \
  --exclude='htmlcov' \
  --exclude='.DS_Store' \
  --exclude='._*' \
  --exclude='*.tsbuildinfo' \
  --exclude='next-env.d.ts' \
  --exclude='.eslintcache' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='htmlcov' \
  --exclude='archives' \
  --exclude='services/saas-api/var' \
  --exclude='*.zip' \
  --exclude='*.tar.gz' \
  -czf "$ARCHIVE_PATH" .

echo "Verifying archive contents..."
if tar -tzf "$ARCHIVE_PATH" | grep -E '(^|/)\._|tsbuildinfo|next-env\.d\.ts|node_modules|\.next|/dist/|/build/|\.turbo|\.venv|__pycache__|\.pytest_cache|\.pyc|(^|/)\.env$|\.DS_Store|\.eslintcache|(^|/)archives(/|$)|services/saas-api/var(/|$)'; then
  echo "Error: archive contains excluded paths." >&2
  exit 1
fi

tar -tzf "$ARCHIVE_PATH" >/tmp/archive-list-check.txt
echo "Archive listing saved to /tmp/archive-list-check.txt"

echo "Removed $JUNK_COUNT junk file(s)."
echo "Archive ready: $ARCHIVE_PATH"
