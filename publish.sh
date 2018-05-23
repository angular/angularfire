# To publish angularfire2 to npm, run the following steps
# Edit the version in package.json
# Run `npm run changelog` to generate the new changelog (and check the changelog)
# Run `npm run reference` to generate the reference docs
# git commit the changelog, reference, and package.json changes
# git tag <new version>
# git push <new version> && git push <current branch>
# Log in to npm: npm login
# Run this script: ./publish.sh

npm run build_npm && npm publish dist
