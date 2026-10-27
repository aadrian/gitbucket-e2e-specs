#!/usr/bin/env bash
# Starts GitBucket from a war with its own (empty or kept) home and waits until it answers.
# Usage: scripts/start-gitbucket.sh <gitbucket.war> [port] [home]
#   port: default 8080; home: default a new temporary directory.
# Writes <home>.log and <home>.pid next to the home; stop it with: kill "$(cat <home>.pid)"
set -euo pipefail

war=${1:?usage: start-gitbucket.sh <gitbucket.war> [port] [home]}
port=${2:-8080}
home=${3:-$(mktemp -d)}
mkdir -p "$home" "$home.tmp"

# detached, so it outlives the shell that started it (CI steps, act's docker exec)
setsid nohup java -jar "$war" --port="$port" --gitbucket.home="$home" --temp_dir="$home.tmp" \
  > "$home.log" 2>&1 < /dev/null &
echo $! > "$home.pid"

for _ in $(seq 1 120); do
  if curl -fs -o /dev/null "http://localhost:$port/signin"; then
    echo "GitBucket answers on http://localhost:$port/ (home $home, log $home.log)"
    exit 0
  fi
  if ! kill -0 "$(cat "$home.pid")" 2> /dev/null; then
    echo "GitBucket exited:" >&2
    cat "$home.log" >&2
    exit 1
  fi
  sleep 1
done
echo "GitBucket did not answer within 120 s:" >&2
tail -n 50 "$home.log" >&2
exit 1
