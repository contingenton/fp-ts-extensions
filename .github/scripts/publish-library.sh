#!/usr/bin/env bash
set -o errexit -o noclobber -o nounset -o pipefail

getBuildType() {
  local release_type="minor"
  if [[ "$1" == *"feat"* ]]; then
    release_type="major"
  elif [[ "$1" == *"fix"* || "$1" == *"docs"* || "$1" == *"chore"* ]]; then
    release_type="patch"
  fi
  echo "$release_type"
}

PARENT_DIR="$PWD"
ROOT_DIR="."

echo "Removing Dist"
rm -rf "${ROOT_DIR:?}/dist"

COMMIT_MESSAGE="$(git log -1 --pretty=format:"%s")"
RELEASE_TYPE=${1:-$(getBuildType "$COMMIT_MESSAGE")}

DRY_RUN=${DRY_RUN:-"False"}

AFFECTED=$(npx nx affected:libs --plain --base=origin/main~1)
if [ "$AFFECTED" != "" ]; then
  cd "$PARENT_DIR"
  echo "Copy Environment Files"

  while IFS= read -r -d $' ' lib; do
    echo "Setting version for $lib"
    cd "$PARENT_DIR"
    cd "$ROOT_DIR/packages/${lib}"

    npm version "$RELEASE_TYPE" -f -m "fp-ts-extensions $RELEASE_TYPE"
    echo "Building $lib"
    cd "$PARENT_DIR"
    npm run build "$lib" -- --prod --with-deps
    wait
  done <<<"$AFFECTED "

  cd "$PARENT_DIR"

  while IFS= read -r -d $' ' lib; do
    if [ "$DRY_RUN" == "False" ]; then
      echo "Publishing $lib"
      npm publish "$ROOT_DIR/dist/packages/${lib}" --access=public
    else
      echo "Dry Run, not publishing $lib"
    fi
    wait
  done <<<"$AFFECTED " # leave space on end to generate correct output
else
  echo "No Libraries to publish"
fi
