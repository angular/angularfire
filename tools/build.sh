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
    OVERRIDE_VERSION=$(node -e "console.log(require('./package.json').version)")-canary.$SHORT_SHA
    NPM_TAG=canary
fi;

npm --no-git-tag-version --allow-same-version -f version $OVERRIDE_VERSION
yarn build
TARBALL=$(npm pack ./dist/packages-dist | tail -n 1)
cp $TARBALL angularfire.tgz

echo "npm publish \$(dirname \"\$0\")/angularfire.tgz --tag $NPM_TAG" > ./publish.sh
chmod +x ./publish.sh

echo "tar -xzvf \$(dirname \"\$0\")/angularfire.tgz && rsync -a package/ ./dist/packages-dist/" > ./unpack.sh
chmod +x ./unpack.sh
