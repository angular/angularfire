apt-get -y update
apt-get -y install rsync
yarn

if test $TAG_NAME; then
    export VERSION=$TAG_NAME
else
    export VERSION=$(npm version | head -n 1 |  sed "s/^.*: '\([^']*\).*/\1/")-canary.$SHORT_SHA
fi

npm version $VERSION
yarn build
yarn build:wrapper