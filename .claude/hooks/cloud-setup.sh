#!/usr/bin/env bash
# SessionStart hook — brings up the local Supabase stack in Claude Code cloud
# sessions so migrations and tests have a real database to run against.
#
# Cloud-only by design: it must never disturb a developer's own running stack.
#
# Detection note: CLAUDE_CODE_REMOTE is widely used for this but is NOT listed in
# the official environment-variable reference, so it is treated as one signal
# among several rather than as a guarantee. The rule below is deliberately
# fail-safe — it runs ONLY on a positive cloud signal, so if every signal is
# absent (as on a laptop) the hook does nothing. Set TREE_TROUPERS_CLOUD_SETUP=0
# to force it off, or =1 to force it on.
#
# Always exits 0: a non-zero exit from a SessionStart hook surfaces as a failed
# session start. A database that failed to boot should be a message Claude can
# read and act on, not a dead session.

set -uo pipefail

is_cloud_session() {
  # Explicit override always wins, in both directions.
  case "${TREE_TROUPERS_CLOUD_SETUP:-}" in
    0 | false) return 1 ;;
    1 | true) return 0 ;;
  esac

  [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && return 0
  [ -n "${CLAUDE_CODE_CLOUD:-}" ] && return 0
  # The cloud sandbox runs as root in a container; a normal workstation session
  # does not. Requiring both conditions keeps this from matching a local
  # rootless Docker setup or a plain root login.
  [ "$(id -u)" = "0" ] && [ -f /.dockerenv ] && return 0

  return 1
}

if ! is_cloud_session; then
  # Local session: leave the developer's environment completely alone.
  exit 0
fi

echo "[cloud-setup] Cloud session detected; preparing local Supabase."

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

if [ ! -d node_modules ]; then
  echo "[cloud-setup] Installing dependencies..."
  yarn install --frozen-lockfile || yarn install || echo "[cloud-setup] WARNING: install failed."
fi

[ -f .env ] || { cp .env.local.example .env && echo "[cloud-setup] Wrote .env from .env.local.example."; }

# The sandbox ships dockerd but does not always have it running.
if ! docker info >/dev/null 2>&1; then
  echo "[cloud-setup] Starting Docker daemon..."
  # Braces matter: `a || b &` would background the whole list, so a failing
  # `service` call would never fall through to dockerd synchronously.
  if ! sudo service docker start >/dev/null 2>&1; then
    sudo dockerd >/tmp/dockerd.log 2>&1 &
  fi
  for _ in $(seq 1 30); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! docker info >/dev/null 2>&1; then
  echo "[cloud-setup] WARNING: Docker unavailable — Supabase cannot start."
  echo "[cloud-setup] Run 'npm run db:start' manually once Docker is up."
  exit 0
fi

# Prefer the pinned devDependency over a network download; fall back to npx only
# if the install step did not produce the binary.
SUPABASE_BIN="./node_modules/.bin/supabase"
[ -x "$SUPABASE_BIN" ] || SUPABASE_BIN="npx --yes supabase"

echo "[cloud-setup] Starting Supabase (first run pulls images; this can take a few minutes)..."
if $SUPABASE_BIN start; then
  # Applies every migration from scratch, then seed.sql.
  echo "[cloud-setup] Applying migrations and seed data..."
  if $SUPABASE_BIN db reset --local; then
    echo "[cloud-setup] Database ready. Logins: admin@example.com / member@example.com (password123)."
  else
    echo "[cloud-setup] WARNING: db reset failed — inspect with '$SUPABASE_BIN status'."
  fi
else
  echo "[cloud-setup] WARNING: 'supabase start' failed. Check '$SUPABASE_BIN status'."
fi

exit 0
