module.exports = {
    packages: {
      "firebase": {
        entryPoints: {
          ".": { override: { browser: undefined } },
          "./analytics": { override: { browser: undefined } },
          "./app": {override: { browser: undefined } },
          "./auth": {override: { browser: undefined } },
          "./database": { override: { browser: undefined } },
          "./firestore": { override: { browser: undefined } },
          "./functions": { override: { browser: undefined } },
          "./installations": { override: { browser: undefined } },
          "./storage": { override: { browser: undefined } },
          "./performance": { override: { browser: undefined } },
          "./remote-config": { override: { browser: undefined } },
        },
        generateDeepReexports: true
      },
      "@firebase/analytics": {
        entryPoints: { ".": { override : { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/app": {
        entryPoints: { ".": { override : { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/auth": {
        entryPoints: { ".": { override : { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/component": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/database": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/firestore": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/functions": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/installations": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/messaging": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/storage": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/performance": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/polyfills": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/remote-config": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/util": {
        entryPoints: { ".": { override: { browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
    }
}  