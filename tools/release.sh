echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
cd dist/packages-dist

LATEST_TEST="^v[^-]*$"

if test $TAG_NAME; then
    if [[ ! $TAG_NAME =~ $LATEST_TEST ]]; then
        npm publish . --tag next
    else
        npm publish . &&
        cd ../wrapper-dist &&
        npm publish . &&
        npm deprecate angularfire2 "AngularFire has moved, we're now @angular/fire"
    fi
else
    npm publish . --tag canary
fi

# TODO put this in a shell trap
rm -f .npmrc