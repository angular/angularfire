SHORT_SHA=$(git rev-parse --short $GITHUB_SHA)
TAG_TEST="^refs/tags/.+$"
LATEST_TEST="^[^-]*$"

if [[ $GITHUB_REF =~ $TAG_TEST ]]; then
    OVERRIDE_VERSION=${GITHUB_REF/refs\/tags\//}
    if [[ $OVERRIDE_VERSION =~ $LATEST_TEST ]]; then
        NPM_TAG=latest
    else
        NPM_TAG=next
    fi;
else
    FULL_VERSION=$(node -e "console.log(require('./package.json').version)")
    # Name the canary after the release itself, never after a prerelease of it. A canary built on
    # `21.0.0-rc.1` sorts above it, so the caret range `ng add` writes into a user's package.json
    # resolves to the canary rather than to the release candidate they asked for.
    BASE_VERSION=${FULL_VERSION%%-*}
    if [[ $BASE_VERSION != "$FULL_VERSION" ]]; then
        echo "package.json version is $FULL_VERSION. Naming this canary after $BASE_VERSION instead, so it does not outrank $FULL_VERSION on npm. Prereleases are published from their own git tag, so this field is meant to hold a plain release number." >&2
    fi
    OVERRIDE_VERSION=$BASE_VERSION-canary.$SHORT_SHA
    NPM_TAG=canary
fi;

npm --no-git-tag-version --allow-same-version -f version $OVERRIDE_VERSION

npm run build &&
    echo "npm publish . --access public --registry https://wombat-dressing-room.appspot.com --tag $NPM_TAG" > ./dist/packages-dist/publish.sh &&
    chmod +x ./dist/packages-dist/publish.sh
