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