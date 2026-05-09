#!/bin/bash
# End-to-end check that login / logout / refresh are isolated per frontend.
#
# Verifies (against a running backend):
#   1. Login from `club` origin sets only `__tomoh_club`, not other apps' cookies.
#   2. The cookie obtained from `club` cannot be replayed from `team` origin.
#   3. Logout from `club` clears only `__tomoh_club`; a parallel `team` session survives.
#   4. After logout, refreshToken from `club` returns null.
#
# Usage:
#   API=http://localhost:7001/graphql \
#   EMAIL=foo@example.com PASSWORD=secret \
#   bash scripts/test-auth-isolation.sh
#
# Or against production:
#   API=https://api.omkooora.com/graphql \
#   EMAIL=... PASSWORD=... \
#   bash scripts/test-auth-isolation.sh

API="${API:-http://localhost:7001/graphql}"
EMAIL="${EMAIL:?set EMAIL=...}"
PASSWORD="${PASSWORD:?set PASSWORD=...}"

CLUB_ORIGIN="${CLUB_ORIGIN:-https://club.omkooora.com}"
TEAM_ORIGIN="${TEAM_ORIGIN:-https://team.omkooora.com}"

CLUB_JAR=$(mktemp)
TEAM_JAR=$(mktemp)
trap 'rm -f "$CLUB_JAR" "$TEAM_JAR"' EXIT

pass() { printf "  \033[32m✔\033[0m %s\n" "$1"; }
fail() { printf "  \033[31m✘\033[0m %s\n" "$1"; FAILED=1; }
hr()   { printf "\n\033[1m== %s ==\033[0m\n" "$1"; }

FAILED=0

call() {
    # call <origin> <cookie-jar> <save?> <query-json>
    local origin="$1" jar="$2" save="$3" data="$4"
    if [[ "$save" == "save" ]]; then
        curl -sS -X POST "$API" \
            -H "Content-Type: application/json" \
            -H "Origin: $origin" \
            -b "$jar" -c "$jar" \
            -d "$data"
    else
        curl -sS -X POST "$API" \
            -H "Content-Type: application/json" \
            -H "Origin: $origin" \
            -b "$jar" \
            -d "$data"
    fi
}

# A cookie with an expiry in the past is dead; curl keeps the line in the jar
# but never sends it. Treat anything with a non-future expiry as gone.
cookie_alive() {
    local jar="$1" name="$2"
    local now=$(date +%s)
    awk -v name="$name" -v now="$now" '
        $1 ~ /^#HttpOnly_/ { sub(/^#HttpOnly_/, "", $1) }
        $0 ~ /^#/ { next }
        NF >= 7 && $6 == name && $5+0 > now { print; found=1 }
        END { exit !found }
    ' "$jar"
}

# --- 1. Login from club origin -------------------------------------------------
hr "1) Login from club origin"
LOGIN_PAYLOAD=$(cat <<JSON
{"query":"mutation(\$c: loginInfo){authenticateUser(content:\$c){token user{id email}}}","variables":{"c":{"email":"$EMAIL","password":"$PASSWORD"}}}
JSON
)
RESP=$(call "$CLUB_ORIGIN" "$CLUB_JAR" save "$LOGIN_PAYLOAD")
echo "$RESP" | grep -q '"token"' \
    && pass "got access token" \
    || { fail "login did not return token: $RESP"; exit 1; }

cookie_alive "$CLUB_JAR" __tomoh_club > /dev/null \
    && pass "__tomoh_club cookie set" \
    || fail "expected __tomoh_club, got jar:\n$(cat "$CLUB_JAR")"

cookie_alive "$CLUB_JAR" __tomoh_team > /dev/null \
    && fail "club login leaked __tomoh_team" \
    || pass "no __tomoh_team set by club login"

cookie_alive "$CLUB_JAR" __tomoh > /dev/null \
    && fail "legacy __tomoh still alive after login" \
    || pass "legacy __tomoh not active"

# --- 2. Try to use club cookie from team origin --------------------------------
hr "2) Replay club cookie from team origin"
RESP=$(call "$TEAM_ORIGIN" "$CLUB_JAR" "" '{"query":"{refreshToken{token}}"}')
TOKEN=$(echo "$RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[[ -z "$TOKEN" ]] \
    && pass "team origin rejected club cookie (refreshToken=null)" \
    || fail "team origin accepted club cookie and issued: $TOKEN"

# --- 3. Login from team origin into a separate jar -----------------------------
hr "3) Login from team origin"
RESP=$(call "$TEAM_ORIGIN" "$TEAM_JAR" save "$LOGIN_PAYLOAD")
echo "$RESP" | grep -q '"token"' \
    && pass "team login succeeded" \
    || { fail "team login failed: $RESP"; exit 1; }

grep -q '__tomoh_team' "$TEAM_JAR" \
    && pass "__tomoh_team cookie set" \
    || fail "expected __tomoh_team, got jar:\n$(cat "$TEAM_JAR")"

# --- 4. Logout from club, team session must survive ----------------------------
hr "4) Logout from club"
RESP=$(call "$CLUB_ORIGIN" "$CLUB_JAR" save '{"query":"mutation{logOut{status}}"}')
echo "$RESP" | grep -q '"status":true' \
    && pass "logout returned status:true" \
    || fail "logout response unexpected: $RESP"

# After logout the refresh from club must fail.
RESP=$(call "$CLUB_ORIGIN" "$CLUB_JAR" "" '{"query":"{refreshToken{token}}"}')
echo "$RESP" | grep -q '"refreshToken":null' \
    && pass "club refresh after logout returns null" \
    || fail "club refresh after logout still works: $RESP"

# Team session must NOT be affected.
RESP=$(call "$TEAM_ORIGIN" "$TEAM_JAR" "" '{"query":"{refreshToken{token}}"}')
echo "$RESP" | grep -q '"token"' \
    && pass "team refresh still works (sibling app unaffected)" \
    || fail "team session was killed by club logout: $RESP"

# --- summary -------------------------------------------------------------------
hr "Result"
if [[ $FAILED -eq 0 ]]; then
    printf "\033[32mAll auth-isolation checks passed.\033[0m\n"
    exit 0
else
    printf "\033[31mOne or more checks failed.\033[0m\n"
    exit 1
fi
