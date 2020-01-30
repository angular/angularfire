yarn

if test $TAG_NAME; then
    export VERSION=$TAG_NAME
else
    export VERSION=$(npm version | sed -n "s/. '@angular\/fire': '\(.*\)',/\1/p")-canary.$SHORT_SHA
fi

echo $VERSION &&
npm version $VERSION --allow-same-version &&
yarn build
