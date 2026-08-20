#!/bin/bash
# Double-click this file to view the gallery.
#
# The site is plain HTML/CSS/JS with no build step, but it does use ES modules,
# and browsers refuse to run those from a file:// URL. So it has to be served.
# This starts the dev server (static public/ + the api/ endpoints) on the first
# free port and opens the browser at it. Needs Node; no packages to install.

cd "$(dirname "$0")" || exit 1

PORT=8080
while lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  # Something is already listening. If it is this project, just reuse it.
  if curl -fsS --max-time 2 "http://localhost:$PORT/gallery.html" 2>/dev/null | grep -q "NULLRIFT"; then
    echo "NULLRIFT is already being served on port $PORT."
    open "http://localhost:$PORT/gallery.html"
    exit 0
  fi
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 8090 ]; then
    echo "Could not find a free port between 8080 and 8090." >&2
    exit 1
  fi
done

echo "Serving $(pwd)"
echo "  http://localhost:$PORT/gallery.html"
echo
echo "Leave this window open while you browse. Press Ctrl-C to stop."
echo

PORT="$PORT" node dev-server.mjs >/dev/null 2>&1 &
SERVER_PID=$!

# Stop the server when this window is closed or Ctrl-C is pressed.
trap 'kill $SERVER_PID 2>/dev/null; exit 0' INT TERM EXIT

# Give the server a moment to bind before pointing the browser at it.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS --max-time 1 "http://localhost:$PORT/gallery.html" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

open "http://localhost:$PORT/gallery.html"

wait $SERVER_PID
