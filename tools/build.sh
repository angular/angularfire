yarn

if test $TAG_NAME; then
    export VERSION=$(echo $TAG_NAME | sed 's/^v\(.*\)$/\1/')
else
    export VERSION=$(npm version | head -n 1 |  sed "s/^.*: '\([^']*\).*/\1/")-canary.$SHORT_SHA
fi

npm version $VERSION
yarn build