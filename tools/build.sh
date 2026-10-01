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
    PACKAGE_VERSION=$(node -e "console.log(require('./package.json').version)")
    if ! PUBLISHED_VERSIONS=$(npm view @angular/fire versions --json); then
        echo "Could not read the published @angular/fire versions from npm, so the canary has no version to build on." >&2
        exit 1
    fi
    BASE_VERSION=$(node ./tools/canary-version.js "$PACKAGE_VERSION" "$PUBLISHED_VERSIONS") || exit 1
    # `sha-` stops npm dropping an all-digit sha's leading zero.
    CANARY_ID=$(TZ=UTC git show -s --date=format-local:%Y%m%d%H%M%S --format=%cd.sha-%h $GITHUB_SHA)
    OVERRIDE_VERSION=$BASE_VERSION-canary.$CANARY_ID
    NPM_TAG=canary
fi;

npm --no-git-tag-version --allow-same-version -f version $OVERRIDE_VERSION

npm run build &&
    echo "npm publish . --access public --registry https://wombat-dressing-room.appspot.com --tag $NPM_TAG" > ./dist/packages-dist/publish.sh &&
    chmod +x ./dist/packages-dist/publish.sh
