echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
cd dist/packages-dist

PRODUCTION_TEST="^[^-]*$"

if test $TAG_NAME; then
    if [[ $TAG_NAME =~ $PRODUCTION_TEST ]]; then
        npm publish .
    else
        npm publish . --tag next
    fi
else
    npm publish . --tag canary
fi

# TODO put this in a shell trap
rm -f .npmrc