#!/usr/bin/env bash
# Gets the GitBucket war to test: a release, or a branch, tag or commit built from source.
# Usage: scripts/get-gitbucket.sh <release | owner/repo@ref> <war>
#   scripts/get-gitbucket.sh 4.48.0 gitbucket.war
#   scripts/get-gitbucket.sh aadrian/gitbucket@my-branch gitbucket.war   (needs JDK 17, takes a few minutes)
# Uses GITHUB_TOKEN for the GitHub API when set. In GitHub Actions, notes in the run summary what it got.
set -euo pipefail

usage='usage: get-gitbucket.sh <release | owner/repo@ref> <war>'
what=${1:?$usage}
war=${2:?$usage}
summary=${GITHUB_STEP_SUMMARY:-/dev/null}

# a release
if [[ $what != *@* ]]; then
  curl -fsSL -o "$war" "https://github.com/gitbucket/gitbucket/releases/download/$what/gitbucket.war"
  echo "GitBucket under test: release [$what](https://github.com/gitbucket/gitbucket/releases/tag/$what)"$'\n' >> "$summary"
  exit 0
fi

# a ref: the commit it points to now, built from its source
repo=${what%%@*}
ref=${what#*@}
api=(curl -fsSL -H 'Accept: application/vnd.github+json')
[[ -n ${GITHUB_TOKEN:-} ]] && api+=(-H "Authorization: Bearer $GITHUB_TOKEN")

{ read -r sha; read -r date; read -r subject; } < <(
  "${api[@]}" "https://api.github.com/repos/$repo/commits/$ref" | node -e '
    const c = JSON.parse(require("fs").readFileSync(0, "utf8"));
    console.log([c.sha, c.commit.committer.date.slice(0, 10), c.commit.message.split("\n")[0]].join("\n"));'
)
echo "Building $repo@$ref, commit $sha ($date: $subject)"

src=$(mktemp -d)
trap 'rm -rf "$src"' EXIT
"${api[@]}" "https://api.github.com/repos/$repo/tarball/$sha" | tar -xz -C "$src" --strip-components=1
(cd "$src" && ./sbt -batch executable)
cp "$src/target/executable/gitbucket.war" "$war"

echo "GitBucket under test: \`$repo@$ref\`, commit [\`${sha:0:8}\`](https://github.com/$repo/commit/$sha)" \
  "($date: $subject)"$'\n' >> "$summary"
