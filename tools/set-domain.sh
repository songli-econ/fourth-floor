#!/bin/bash
# Point a custom domain at the GitHub Pages site, end to end:
#   1. Cloudflare: create or update  <sub> CNAME <owner>.github.io  (DNS only, so GitHub can issue a cert)
#   2. wait until the name resolves
#   3. write CNAME into the repo, push, set the Pages custom domain
#   4. wait for GitHub's certificate, then turn on Enforce HTTPS
#   5. check https://<domain>/ returns 200
# Token: a Cloudflare API token limited to the zone, permission Zone.DNS:Edit,
# read from $CF_API_TOKEN or ~/.config/cloudflare/token. It is never printed.
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${1:-4f.brandonsli.com}"
ZONE="${DOMAIN#*.}"
SUB="${DOMAIN%%.*}"
REPO="songli-econ/fourth-floor"
TARGET="songli-econ.github.io"
TOKEN="${CF_API_TOKEN:-$(cat "$HOME/.config/cloudflare/token" 2>/dev/null || true)}"
TOKEN="$(printf '%s' "$TOKEN" | tr -d '[:space:]')"
[ -n "$TOKEN" ] || { echo "no Cloudflare token (set CF_API_TOKEN or ~/.config/cloudflare/token)" >&2; exit 2; }

cf() { curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$@"; }
API=https://api.cloudflare.com/client/v4

echo "1/5 Cloudflare: $SUB.$ZONE -> $TARGET"
ZONE_ID=$(cf "$API/zones?name=$ZONE" | python3 -c 'import json,sys; r=json.load(sys.stdin); assert r["success"], r["errors"]; print(r["result"][0]["id"])')
sleep 1
REC=$(cf "$API/zones/$ZONE_ID/dns_records?name=$DOMAIN" | python3 -c 'import json,sys; r=json.load(sys.stdin); assert r["success"], r["errors"]; print(r["result"][0]["id"] if r["result"] else "")')
BODY=$(python3 -c 'import json,sys; print(json.dumps({"type":"CNAME","name":sys.argv[1],"content":sys.argv[2],"proxied":False,"ttl":1}))' "$DOMAIN" "$TARGET")
sleep 1
if [ -n "$REC" ]; then
  cf -X PUT "$API/zones/$ZONE_ID/dns_records/$REC" --data "$BODY" | python3 -c 'import json,sys; r=json.load(sys.stdin); assert r["success"], r["errors"]; print("   updated", r["result"]["name"], "->", r["result"]["content"])'
else
  cf -X POST "$API/zones/$ZONE_ID/dns_records" --data "$BODY" | python3 -c 'import json,sys; r=json.load(sys.stdin); assert r["success"], r["errors"]; print("   created", r["result"]["name"], "->", r["result"]["content"])'
fi

echo "2/5 waiting for DNS"
for i in $(seq 1 60); do
  if dig +short "$DOMAIN" @1.1.1.1 | grep -q .; then echo "   resolves: $(dig +short "$DOMAIN" @1.1.1.1 | head -1)"; break; fi
  sleep 5
done

echo "3/5 repo CNAME + Pages custom domain"
if [ "$(cat CNAME 2>/dev/null)" != "$DOMAIN" ]; then
  echo "$DOMAIN" > CNAME
  git add CNAME
  git commit -q -m "Pages: custom domain $DOMAIN"
  git push -q
fi
gh api -X PUT "repos/$REPO/pages" -f "cname=$DOMAIN" >/dev/null

echo "4/5 waiting for GitHub's certificate"
for i in $(seq 1 60); do
  if gh api -X PUT "repos/$REPO/pages" -F https_enforced=true >/dev/null 2>&1; then echo "   HTTPS enforced"; break; fi
  sleep 20
done

echo "5/5 check"
curl -sS -o /dev/null -w "   https://$DOMAIN/ -> %{http_code}\n" "https://$DOMAIN/"
