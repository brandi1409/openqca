#!/usr/bin/env bash
set -euo pipefail

mode="${1:?Usage: deploy/staging-release.sh promote|rollback ENV_FILE [IMAGE_DIGEST] HTTPS_BASE_URL}"
env_file="${2:?Missing staging env file}"
deploy_dir="$(cd "$(dirname "$0")" && pwd)"
compose_file="${deploy_dir}/docker-compose.yml"
previous_file="${env_file}.previous-image"

if [[ ! -f "$env_file" ]]; then
  printf 'Staging env file does not exist: %s\n' "$env_file" >&2
  exit 66
fi

immutable_image() {
  [[ "$1" =~ ^[^[:space:]@]+@sha256:[a-f0-9]{64}$ ]]
}

env_value() {
  awk -F= -v key="$2" '$1 == key { print substr($0, index($0, "=") + 1); exit }' "$1"
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

current="$(env_value "$env_file" OPENQCA_IMAGE)"
if ! immutable_image "$current"; then
  printf 'Current OPENQCA_IMAGE is not an immutable digest: %s\n' "$current" >&2
  exit 64
fi
caddy_image="$(env_value "$env_file" CADDY_IMAGE)"
if ! immutable_image "$caddy_image"; then
  printf 'CADDY_IMAGE is not an immutable digest: %s\n' "$caddy_image" >&2
  exit 64
fi

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
  docker compose --project-name openqca-staging --env-file "$env_file" -f "$compose_file" pull web caddy >/dev/null 2>&1 || true
  docker compose --project-name openqca-staging --env-file "$env_file" -f "$compose_file" up -d --no-build --wait web caddy >/dev/null 2>&1 || true
  exit "$status"
}
trap restore_on_error ERR

docker compose --project-name openqca-staging --env-file "$candidate" -f "$compose_file" config --quiet
docker compose --project-name openqca-staging --env-file "$candidate" -f "$compose_file" pull web caddy
docker compose --project-name openqca-staging --env-file "$candidate" -f "$compose_file" up -d --no-build --wait web caddy
"${deploy_dir}/smoke-staging.sh" "$base_url"

if [[ "$mode" == "promote" ]]; then
  printf 'OPENQCA_IMAGE=%s\n' "$current" > "$previous_file"
  chmod 600 "$previous_file"
fi
mv "$candidate" "$env_file"
trap - ERR
printf 'Staging %s completed with immutable application and proxy images.\n' "$mode"
