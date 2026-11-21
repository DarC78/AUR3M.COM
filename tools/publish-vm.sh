#!/bin/bash
# Called only by the main-branch GitHub publish job after its tested build.
set -euo pipefail
test "${GITHUB_REF:-}" = refs/heads/main
test -n "${RUNNER_TEMP:-}"
test -f web/dist/index.html && test -f web/dist/404.html
release=$(mktemp -d "$RUNNER_TEMP/tenant-frontend-release.XXXXXX")
cp -a web/dist/. "$release/"
node --input-type=module - "$release" <<'JS'
import {writeFileSync} from 'node:fs';
writeFileSync(process.argv[2]+'/hosting-release.json', JSON.stringify({repository:process.env.GITHUB_REPOSITORY,sourceSha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,preview:false})+'\n');
JS
export GIT_INDEX_FILE="$release.index"
git -C "$release" --git-dir="$GITHUB_WORKSPACE/.git" --work-tree="$release" add --force --all .
tree=$(git write-tree)
# Keep a normal, append-only release branch; never force-push over another run.
parent=()
if git ls-remote --exit-code --heads origin refs/heads/vm-preview >/dev/null; then
    git fetch --quiet origin refs/heads/vm-preview
    parent=(-p "$(git rev-parse FETCH_HEAD)")
fi
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
commit=$(printf 'Publish VM preview from %s\n' "$GITHUB_SHA" | git commit-tree "$tree" "${parent[@]}")
git push origin "$commit:refs/heads/vm-preview"

