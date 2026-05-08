#!/usr/bin/env bash
# Smoke test for the players list endpoint.
#
# Run after every backend deploy to verify that allPlayersClub still
# returns rows (regression guard for #12 / fa1bf01 — eager-loading on
# this resolver previously returned an empty list).
#
# Usage:
#   API_URL=https://api.omkooora.com \
#   AUTH_TOKEN=<bearer token from a logged-in session> \
#   ID_CLUB=<a real club id> \
#     bash scripts/smoke-test-players.sh
#
# Exit code:
#   0 — query succeeded and returned at least one row
#   1 — query failed, returned 0 rows, or env vars missing
#
# Where to grab AUTH_TOKEN: open the club app in the browser, sign in,
# open DevTools → Application → Cookies, copy the value of __tomoh, OR
# inspect a GraphQL request in the Network tab and copy the
# Authorization header.

set -u

if [[ -z "${API_URL:-}" || -z "${AUTH_TOKEN:-}" || -z "${ID_CLUB:-}" ]]; then
    echo "❌ Missing env: API_URL, AUTH_TOKEN, ID_CLUB are all required." >&2
    exit 1
fi

ENDPOINT="${API_URL%/}/graphql"

response=$(curl -fsS -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "$(cat <<EOF
{"query":"query SmokeAllPlayersClub(\$idClub: ID) { allPlayersClub(idClub: \$idClub) { id person { id first_name } team { id name } } }","variables":{"idClub":"${ID_CLUB}"}}
EOF
)" 2>&1) || {
    echo "❌ HTTP request failed:" >&2
    echo "$response" >&2
    exit 1
}

# Bail on GraphQL errors.
if echo "$response" | grep -q '"errors"'; then
    echo "❌ GraphQL returned errors:" >&2
    echo "$response" >&2
    exit 1
fi

# Count rows. Use grep -c on the id field instead of pulling jq as a dep.
row_count=$(echo "$response" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')

if [[ "${row_count:-0}" -lt 1 ]]; then
    echo "❌ allPlayersClub returned 0 rows for club ${ID_CLUB}." >&2
    echo "   Raw response: ${response}" >&2
    exit 1
fi

echo "✅ allPlayersClub OK — at least ${row_count} field(s) populated for club ${ID_CLUB}."
echo "   (Field count includes nested person.id and team.id; player count is roughly row_count/3.)"
exit 0
