#!/bin/bash
# Dated tar.gz of the whole project (sources, story, built file) into ~/Backups/fourth-floor/.
set -euo pipefail
cd "$(dirname "$0")"
dest="$HOME/Backups/fourth-floor"
mkdir -p "$dest"
stamp=$(date +%Y%m%d-%H%M%S)
out="$dest/fourth-floor-$stamp.tar.gz"
tar --exclude='./tests/shots' --exclude='./.git' --exclude='.DS_Store' -czf "$out" .
echo "$out ($(du -h "$out" | cut -f1))"
