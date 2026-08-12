#!/usr/bin/env bash
set -euo pipefail

mode="${1:?Usage: deploy/staging-release.sh promote|rollback ENV_FILE [IMAGE_DIGEST] HTTPS_BASE_URL}"
env_file="${2:?Missing staging env file}"
deploy_dir="$(cd "$(dirname "$0")" && pwd)"
managed_compose_file="${deploy_dir}/docker-compose.yml"
shared_compose_file="${deploy_dir}/docker-compose.shared-caddy.yml"
previous_file="${env_file}.previous-image"

if [[ ! -f "$env_file" ]]; then
  printf 'Staging env file does not exist: %s\n' "$env_file" >&2
  exit 66
fi

compose_env_keys=(
  OPENQCA_IMAGE
  OPENQCA_PROXY_MODE
  OPENQCA_UPSTREAM_PORT
  OPENQCA_EDGE_NETWORK
  NEXT_PUBLIC_SITE_URL
  AI_ENABLED
  AI_PROVIDER
  AI_REQUIRE_CLOUD_TIER
  OPENAI_API_KEY
  OPENAI_AI_MODEL
  GEMINI_API_KEY
  GEMINI_AI_MODEL
  AI_REQUEST_BODY_BYTES
  AI_PREAUTH_RATE_LIMIT
  AI_USER_RATE_LIMIT
  AI_MAX_CONCURRENT
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_MONTHLY
  STRIPE_PRICE_INSTITUTION
  CADDY_IMAGE
  OPENQCA_DOMAIN
  CADDY_EMAIL
)

immutable_image() {
  [[ "$1" =~ ^[^[:space:]@]+@sha256:[a-f0-9]{64}$ ]]
}

env_value() {
  awk -F= -v key="$2" '
    $1 == key { value=substr($0, index($0, "=") + 1); found=1 }
    END { if (found) print value }
  ' "$1"
}

env_key_declared() {
  awk -v key="$2" '
    {
      line=$0
      sub(/^[[:space:]]*/, "", line)
      sub(/^export[[:space:]]+/, "", line)
      if (line ~ ("^" key "[[:space:]]*([=:]|$)")) found=1
    }
    END { exit found ? 0 : 1 }
  ' "$1"
}

validate_canonical_env_key() {
  awk -v key="$2" '
    {
      raw=$0
      line=raw
      sub(/^[[:space:]]*/, "", line)
      sub(/^export[[:space:]]+/, "", line)
      if (line ~ ("^" key "[[:space:]]*([=:]|$)")) {
        declarations++
        if (raw !~ ("^" key "=")) noncanonical=1
      }
    }
    END {
      if (noncanonical || declarations > 1) {
        printf "%s must appear at most once and use canonical %s=value syntax.\n", key, key
        exit 1
      }
    }
  ' "$1" >&2
}

run_compose() {
  local selected_env="$1" name
  local -a unset_args=()
  shift
  for name in "${compose_env_keys[@]}"; do
    unset_args+=(-u "$name")
  done
  env "${unset_args[@]}" \
    docker compose --project-name openqca-staging --env-file "$selected_env" -f "$compose_file" "$@"
}

candidate_env() {
  local source="$1" image="$2" target
  if ! immutable_image "$image"; then
    printf 'Expected an immutable image digest; got: %s\n' "$image" >&2
    exit 64
  fi
  target="$(mktemp "${env_file}.candidate.XXXXXX")"
  chmod 600 "$target"
  awk -v image="$image" '
    BEGIN { replaced=0 }
    /^OPENQCA_IMAGE=/ { print "OPENQCA_IMAGE=" image; replaced=1; next }
    { print }
    END { if (!replaced) print "OPENQCA_IMAGE=" image }
  ' "$source" > "$target"
  printf '%s\n' "$target"
}

for name in "${compose_env_keys[@]}"; do
  if ! validate_canonical_env_key "$env_file" "$name"; then
    exit 64
  fi
done

current="$(env_value "$env_file" OPENQCA_IMAGE)"
if ! immutable_image "$current"; then
  printf 'Current OPENQCA_IMAGE is not an immutable digest: %s\n' "$current" >&2
  exit 64
fi
proxy_mode="$(env_value "$env_file" OPENQCA_PROXY_MODE)"
if [[ -z "$proxy_mode" ]] && env_key_declared "$env_file" OPENQCA_PROXY_MODE; then
  printf 'OPENQCA_PROXY_MODE must use the canonical OPENQCA_PROXY_MODE=value syntax.\n' >&2
  exit 64
fi
proxy_mode="${proxy_mode:-managed}"
case "$proxy_mode" in
  managed)
    compose_file="$managed_compose_file"
    services=(web caddy)
    caddy_image="$(env_value "$env_file" CADDY_IMAGE)"
    if ! immutable_image "$caddy_image"; then
      printf 'CADDY_IMAGE is not an immutable digest: %s\n' "$caddy_image" >&2
      exit 64
    fi
    ;;
  shared)
    compose_file="$shared_compose_file"
    services=(web)
    upstream_port="$(env_value "$env_file" OPENQCA_UPSTREAM_PORT)"
    if [[ ! "$upstream_port" =~ ^[0-9]+$ ]] ||
      (( 10#$upstream_port < 1024 || 10#$upstream_port > 65535 )); then
      printf 'OPENQCA_UPSTREAM_PORT must be an unprivileged port from 1024 to 65535; got: %s\n' "$upstream_port" >&2
      exit 64
    fi
    ;;
  *)
    printf 'OPENQCA_PROXY_MODE must be managed or shared; got: %s\n' "$proxy_mode" >&2
    exit 64
    ;;
esac

case "$mode" in
  promote)
    image="${3:?Missing immutable application image digest}"
    base_url="${4:?Missing HTTPS staging base URL}"
    ;;
  rollback)
    base_url="${3:?Missing HTTPS staging base URL}"
    if [[ ! -f "$previous_file" ]]; then
      printf 'No previous image record exists: %s\n' "$previous_file" >&2
      exit 66
    fi
    image="$(env_value "$previous_file" OPENQCA_IMAGE)"
    ;;
  *)
    printf 'Expected promote or rollback; got: %s\n' "$mode" >&2
    exit 64
    ;;
esac

candidate="$(candidate_env "$env_file" "$image")"
restore_on_error() {
  local status=$?
  rm -f "$candidate"
  printf 'Staging %s failed; restoring the last known-good digest.\n' "$mode" >&2
  run_compose "$env_file" pull "${services[@]}" >/dev/null 2>&1 || true
  run_compose "$env_file" up -d --no-build --wait "${services[@]}" >/dev/null 2>&1 || true
  exit "$status"
}
trap restore_on_error ERR

run_compose "$candidate" config --quiet
run_compose "$candidate" pull "${services[@]}"
run_compose "$candidate" up -d --no-build --wait "${services[@]}"
"${deploy_dir}/smoke-staging.sh" "$base_url"

if [[ "$mode" == "promote" ]]; then
  printf 'OPENQCA_IMAGE=%s\n' "$current" > "$previous_file"
  chmod 600 "$previous_file"
fi
mv "$candidate" "$env_file"
trap - ERR
if [[ "$proxy_mode" == "managed" ]]; then
  printf 'Staging %s completed with immutable application and proxy images.\n' "$mode"
else
  printf 'Staging %s completed with an immutable application image behind the existing host proxy.\n' "$mode"
fi
