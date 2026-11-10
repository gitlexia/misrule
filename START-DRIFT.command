#!/bin/bash
cd "$(dirname "$0")"
echo 'MISRULE / DRIFT + LIVING EDITIONS / v0.3'
if ! command -v node >/dev/null; then
  echo 'Node.js 20+ is required. Install it from nodejs.org and run this launcher again.'
  read -r -p 'Press Enter to close...'
  exit 1
fi
if command -v lsof >/dev/null && lsof -ti tcp:4317 >/dev/null; then
  echo 'Port 4317 is already used. Stop that server and try again.'
  read -r -p 'Press Enter to close...'
  exit 1
fi
(sleep 1; open http://localhost:4317) &
PORT=4317 node server.mjs
