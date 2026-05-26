#!/usr/bin/env bash
# Resolve pnpm command: prefer `pnpm`, fall back to `corepack pnpm`.
resolve_pnpm_cmd() {
  if command -v pnpm >/dev/null 2>&1; then
    echo "pnpm"
    return 0
  fi
  if command -v corepack >/dev/null 2>&1 && corepack pnpm --version >/dev/null 2>&1; then
    echo "corepack pnpm"
    return 0
  fi
  echo "ERROR: pnpm not found. Install pnpm or enable corepack (corepack enable && corepack prepare pnpm@9.15.0 --activate)" >&2
  return 1
}

run_pnpm() {
  local cmd
  cmd="$(resolve_pnpm_cmd)" || return 1
  # shellcheck disable=SC2086
  $cmd "$@"
}
