#!/usr/bin/env bash
# Non-destructive Nuxt deploy.
#
# The 2026-05-18 incident: `nuxt build` rewrites `.output/` in place,
# atomically deleting every `_nuxt/<hash>` chunk that did not exist in the
# previous build. Clients holding an older HTML (or Cloudflare edge nodes
# serving cached HTML during its SWR window) then request hashes that
# vanished, Nitro's publicAssets handler returns 500, and Cloudflare pins
# the error response at the edge because `_nuxt/**` carries
# `cache-control: immutable`.
#
# This script keeps deploys non-destructive:
#   1. Snapshot the current `_nuxt/` chunks before build.
#   2. Run the normal `pnpm build` (which rewrites `.output/`).
#   3. rsync the snapshot back with `--ignore-existing`, so new hashes
#      stay authoritative but old hashes survive long enough for stale
#      clients / edge caches to drain.
#   4. `pm2 reload` rather than `start` so in-flight requests finish.
#
# Old chunks accumulate over time; a separate cron should prune anything
# under `.output/public/_nuxt/` older than 14 days.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
OUTPUT_DIR="$REPO_ROOT/.output"
NUXT_DIR="$OUTPUT_DIR/public/_nuxt"
SNAPSHOT_DIR="$REPO_ROOT/.deploy-nuxt-snapshot"

log() { printf '[deploy] %s\n' "$*"; }

log "Regenerating API SDK"
pnpm openapi

if [[ -d "$NUXT_DIR" ]]; then
  log "Snapshotting current _nuxt/ chunks to $SNAPSHOT_DIR"
  rm -rf "$SNAPSHOT_DIR"
  cp -a "$NUXT_DIR" "$SNAPSHOT_DIR"
else
  log "No previous _nuxt/ to snapshot — first deploy"
  rm -rf "$SNAPSHOT_DIR"
fi

log "Building"
pnpm build

if [[ ! -d "$OUTPUT_DIR/public/_nuxt" || ! -f "$OUTPUT_DIR/server/index.mjs" ]]; then
  log "ERROR: build incomplete (.output/server/index.mjs missing) — aborting"
  exit 1
fi

if [[ -d "$SNAPSHOT_DIR" ]]; then
  log "Restoring old _nuxt/ hashes (new build wins on conflict)"
  # --ignore-existing: only copy files the new build does NOT already have.
  rsync -a --ignore-existing "$SNAPSHOT_DIR/" "$NUXT_DIR/"
  rm -rf "$SNAPSHOT_DIR"
fi

log "Reloading PM2"
if pm2 describe CodetimeWebV3 >/dev/null 2>&1; then
  pm2 reload CodetimeWebV3 --update-env
else
  pm2 start ecosystem.config.cjs
fi

log "Done"
