#!/usr/bin/env bash
set -euo pipefail

base_url="${1:?Usage: deploy/smoke-staging.sh https://staging.example.org}"
base_url="${base_url%/}"
if [[ "$base_url" != https://* ]]; then
  printf 'Expected an HTTPS staging base URL; got: %s\n' "$base_url" >&2
  exit 64
fi
body_file="$(mktemp)"
headers_file="$(mktemp)"
cleanup() { rm -f "$body_file" "$headers_file"; }
trap cleanup EXIT

curl --fail --silent --show-error \
  --proto '=https' --tlsv1.2 \
  --connect-timeout 5 --max-time 15 \
  --retry 8 --retry-all-errors --retry-delay 2 \
  --dump-header "$headers_file" --output "$body_file" \
  "${base_url}/api/health"

body="$(cat "$body_file")"
if [[ "$body" != '{"status":"ok"}' ]]; then
  printf 'Unexpected health response from %s/api/health\n' "$base_url" >&2
  exit 1
fi
if ! grep -Eiq '^content-type:[[:space:]]*application/json' "$headers_file"; then
  printf 'Health response is not JSON: %s/api/health\n' "$base_url" >&2
  exit 1
fi
if ! grep -Eiq '^cache-control:[[:space:]]*no-store' "$headers_file"; then
  printf 'Health response is cacheable: %s/api/health\n' "$base_url" >&2
  exit 1
fi
printf 'Staging health check passed: %s/api/health\n' "$base_url"
