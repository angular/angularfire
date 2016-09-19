## Contributing Process
1. Create an issue to open the line of communication. **Please create an issue before sending a PR :)**
2. Discussion on the issue.
3. PR sent based on discussion.

## Initial Setup

```
$ npm install
$ npm run build
$ npm test
```

## Build CJS/ES5 Output

`$ npm run build`

## Run Karma Against CJS/ES5 Output

`$ npm test`

## Build Docs

`$ npm run docs`

## Build and Deploy Docs to Firebase Hosting

(Ask @jeffbcross to add you as a collaborator)

```
$ npm install -g firebase-tools
$ firebase login
$ npm run docs
$ cd docs
$ firebase deploy
```

## Error TS6053: File '...index.d.ts' not found.

You may need to run `typings install`

