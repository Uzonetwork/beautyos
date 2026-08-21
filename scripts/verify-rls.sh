#!/usr/bin/env bash
# verify-rls.sh — confirms phase 3 of the businesses RLS lockdown
# (supabase/lock_businesses_table.sql) actually took effect in production.
#
# Uses ONLY the anon key from .env.local — this probes exactly what an
# anonymous visitor's browser can see, the same as before this script
# existed but now aimed at columns that should be locked down.
#
# Prints row counts and PASS/FAIL only. Never prints row values — this
# is meant to be safe to run (and paste the output of) against
# production without leaking any real business's data.
#
# Usage: scripts/verify-rls.sh   (run from repo root, after applying
# lock_businesses_table.sql in the Supabase SQL editor)

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "FAIL: $ENV_FILE not found (run from repo root, or set ENV_FILE)" >&2
  exit 1
fi

SUPABASE_URL=$(grep '^VITE_SUPABASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r')
ANON_KEY=$(grep '^VITE_SUPABASE_ANON_KEY=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r')

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "FAIL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing from $ENV_FILE" >&2
  exit 1
fi

if ! command -v python >/dev/null 2>&1; then
  echo "FAIL: python is required on PATH to parse PostgREST JSON responses" >&2
  exit 1
fi

REST="${SUPABASE_URL%/}/rest/v1"
PASS_COUNT=0
FAIL_COUNT=0

# Extracts the row count from a PostgREST JSON array body. Prints -1 if
# the body isn't a JSON array (e.g. an error object) so callers can
# treat that as "not a leak" rather than crashing.
json_row_count() {
  python - "$1" <<'PY'
import json, sys
try:
    d = json.loads(sys.argv[1])
    print(len(d) if isinstance(d, list) else -1)
except Exception:
    print(-1)
PY
}

# Prints the sorted, de-duplicated set of top-level keys across every
# object in a JSON array body, comma-separated. Empty output if the
# array is empty or not parseable.
json_keys() {
  python - "$1" <<'PY'
import json, sys
try:
    d = json.loads(sys.argv[1])
    keys = sorted({k for row in d for k in row.keys()})
    print(','.join(keys))
except Exception:
    pass
PY
}

# probe_locked_column <column> — the column must be unreachable by the
# anon key after phase 3: either the request errors (column dropped) or
# it succeeds but RLS filters every row down to an empty array (column
# still exists but no policy grants anon a path to it). Getting actual
# rows back is a FAIL — it means anon can still read that column.
probe_locked_column() {
  local col="$1" raw http_code body row_count
  raw=$(curl -sS -w '\n%{http_code}' \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    "$REST/businesses?select=$col&limit=5")
  http_code=$(echo "$raw" | tail -n1)
  body=$(echo "$raw" | sed '$d')

  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    row_count=$(json_row_count "$body")
    if [[ "$row_count" == "0" ]]; then
      echo "PASS  businesses.$col   HTTP $http_code, 0 rows"
      PASS_COUNT=$((PASS_COUNT+1))
    else
      echo "FAIL  businesses.$col   HTTP $http_code, $row_count row(s) returned to anon"
      FAIL_COUNT=$((FAIL_COUNT+1))
    fi
  else
    echo "PASS  businesses.$col   HTTP $http_code, request rejected"
    PASS_COUNT=$((PASS_COUNT+1))
  fi
}

echo "== Base businesses table — anon key must not be able to read these =="
for col in user_id pin paystack_reference plan_expires_at subscription_status; do
  probe_locked_column "$col"
done

echo
echo "== businesses_public — anon key should see only the intended columns =="

ALLOWED_COLS="id,name,owner_name,tagline,business_type,custom_business_type,avatar_url,whatsapp,city,state,slug,avg_rating,rating_count,created_at,is_active"

raw=$(curl -sS -w '\n%{http_code}' \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  "$REST/businesses_public?select=*&limit=5")
http_code=$(echo "$raw" | tail -n1)
body=$(echo "$raw" | sed '$d')

if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
  row_count=$(json_row_count "$body")
  echo "businesses_public row count: $row_count   HTTP $http_code"

  if [[ "$row_count" -gt 0 ]]; then
    keys=$(json_keys "$body")
    unexpected=$(python - "$ALLOWED_COLS" "$keys" <<'PY'
import sys
allowed = set(sys.argv[1].split(','))
got = set(sys.argv[2].split(',')) if sys.argv[2] else set()
print(','.join(sorted(got - allowed)))
PY
)
    if [[ -z "$unexpected" ]]; then
      echo "PASS  businesses_public exposes only allowed columns"
      PASS_COUNT=$((PASS_COUNT+1))
    else
      echo "FAIL  businesses_public exposes unexpected column(s): $unexpected"
      FAIL_COUNT=$((FAIL_COUNT+1))
    fi
  else
    echo "WARN  businesses_public returned 0 rows — can't verify its column set with no row to inspect (not counted as pass or fail)"
  fi
else
  echo "FAIL  businesses_public   HTTP $http_code, request failed"
  FAIL_COUNT=$((FAIL_COUNT+1))
fi

echo
echo "== Summary: $PASS_COUNT passed, $FAIL_COUNT failed =="
[[ "$FAIL_COUNT" -eq 0 ]]
