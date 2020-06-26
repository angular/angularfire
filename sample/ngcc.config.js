module.exports = {
    packages: {
      "firebase": {
        entryPoints: {
          ".": { override: { main: undefined, browser: undefined } },
          "./analytics": { override: { main: undefined, browser: undefined } },
          "./app": {override: { main: undefined, browser: undefined } },
          "./auth": {override: { main: undefined, browser: undefined } },
          "./database": { override: { main: undefined, browser: undefined } },
          "./firestore": { override: { main: undefined, browser: undefined } },
          "./functions": { override: { main: undefined, browser: undefined } },
          "./installations": { override: { main: undefined, browser: undefined } },
          "./storage": { override: { main: undefined, browser: undefined } },
          "./performance": { override: { main: undefined, browser: undefined } },
          "./remote-config": { override: { main: undefined, browser: undefined } },
        },
        generateDeepReexports: true
      },
      "@firebase/analytics": {
        entryPoints: { ".": { override : { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/app": {
        entryPoints: { ".": { override : { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/auth": {
        entryPoints: { ".": { override : { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/component": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/database": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/firestore": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/functions": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/installations": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/messaging": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/storage": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/performance": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/remote-config": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      },
      "@firebase/util": {
        entryPoints: { ".": { override: { main: undefined, browser: undefined } } },
        ignorableDeepImportMatchers: [ /@firebase\/app-types\/private/ ]
      }
    }
}  