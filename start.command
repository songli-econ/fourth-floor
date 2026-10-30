#!/bin/bash
# Double-click to play locally. Rebuilds the single-file version if node is available.
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null && node tools/build.mjs >/dev/null
open "dist/fourth-floor.html"
