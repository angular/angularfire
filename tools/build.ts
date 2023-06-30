import { spawn } from 'cross-spawn';
import { copy, readFile, writeFile } from 'fs-extra';
import { prettySize } from 'pretty-size';
import { file as gzipSizeFile } from 'gzip-size';
import { join } from 'path';

// TODO infer these from the package.json
const MODULES = [
  'core', 'app', 'app-check', 'auth-guard', 'compat', 'analytics', 'auth', 'database', 'firestore', 'functions',
  'remote-config', 'storage', 'messaging', 'performance', 'compat/analytics',
  'compat/auth-guard', 'compat/auth', 'compat/database', 'compat/firestore',
  'compat/functions', 'compat/remote-config', 'compat/storage', 'compat/messaging',
  'compat/performance', 'firestore/lite',
];
const LAZY_MODULES = ['compat/analytics', 'compat/auth', 'compat/functions', 'compat/messaging', 'compat/remote-config'];
const UMD_NAMES = MODULES.map(m => m === 'core' ? 'angular-fire' : `angular-fire-${m.replace('/', '-')}`);
const ENTRY_NAMES = MODULES.map(m => m === 'core' ? '@angular/fire' : `@angular/fire/${m}`);

interface OverrideOptions {
  exportName?: string;
  zoneWrap?: boolean;
  blockUntilFirst?: boolean;
  override?: boolean;
}

function zoneWrapExports() {
  const reexport = async (
    module: string,
    name: string,
    path: string,
    exports: string[],
    overrides: Record<string, OverrideOptions | null> = {}
  ) => {
    const imported = await import(path);
    const toBeExported: Array<[string, string, boolean]> = exports.
      filter(it => !it.startsWith('_') && overrides[it] !== null && overrides[it]?.override !== true).
      map(importName => {
        const zoneWrap = typeof imported[importName] === 'function' &&
          (overrides[importName]?.zoneWrap ?? importName[0] !== importName[0].toUpperCase());
        const exportName = overrides[importName]?.exportName ?? importName;
        return [importName, exportName, zoneWrap];
      });
    const zoneWrapped = toBeExported.filter(([, , zoneWrap]) => zoneWrap);
    const rawExport = toBeExported.filter(([, , zoneWrap]) => !zoneWrap);
    const overridden = Object.keys(overrides).filter(key => overrides[key]?.override);
    const isFirebaseSDK = path.startsWith('firebase/');
    const hasZoneWrappedFns = zoneWrapped.length > 0;
    const hasRawExportedFns = rawExport.length > 0;
    const hasOverridedFns = overridden.length > 0;
    const zoneWrappedImports = zoneWrapped.map(([importName]) => `${importName} as _${importName}`).join(',\n  ');
    const rawExportedFns = rawExport.map(([importName, exportName]) =>
      `${importName}${exportName === importName ? '' : `as ${exportName}`}`).join(',\n  ');
    const overriddenFns = overridden.join(',\n  ');
    const exportedZoneWrappedFns = zoneWrapped.map(([importName, exportName]) =>
      `export const ${exportName} = ɵzoneWrap(_${importName}, ${overrides[importName]?.blockUntilFirst ?? true});`)
        .join('\n');
    const filePath = join(process.cwd(), 'src', `${module}/${name}.ts`);
    // TODO(davideast): Create a builder pattern for this file for readability
    const fileOutput = `// DO NOT MODIFY, this file is autogenerated by tools/build.ts
${isFirebaseSDK ? `export * from '${path}';\n` : ''}${hasZoneWrappedFns ? `import { ɵzoneWrap } from '@angular/fire';
import {
  ${zoneWrappedImports}
} from '${path}';
` : ''}${!isFirebaseSDK && hasRawExportedFns ? `
export {
  ${rawExportedFns}
} from '${path}';
` : ''}${hasOverridedFns ? `
export {
  ${overriddenFns}
} from './overrides';
` : ''}
${exportedZoneWrappedFns}
`;
    await writeFile(filePath, fileOutput);
  };
  return Promise.all([
    reexport('analytics', 'firebase', 'firebase/analytics', ["getAnalytics", "initializeAnalytics", "isSupported", "logEvent", "setAnalyticsCollectionEnabled", "setCurrentScreen", "settings", "setUserId", "setUserProperties"], {
      isSupported: { override: true },
    }),
    reexport('app', 'firebase', 'firebase/app', ["deleteApp", "getApp", "getApps", "initializeApp", "onLog", "registerVersion", "setLogLevel", "FirebaseError", "SDK_VERSION"]),
    reexport('app-check', 'firebase', 'firebase/app-check', ["getToken", "initializeAppCheck", "onTokenChanged", "setTokenAutoRefreshEnabled", "CustomProvider", "ReCaptchaEnterpriseProvider", "ReCaptchaV3Provider"]),
    reexport('auth', 'rxfire', 'rxfire/auth', ["authState", "user", "idToken"]),
    reexport('auth', 'firebase', 'firebase/auth', ["applyActionCode", "beforeAuthStateChanged", "checkActionCode", "confirmPasswordReset", "connectAuthEmulator", "createUserWithEmailAndPassword", "deleteUser", "fetchSignInMethodsForEmail", "getAdditionalUserInfo", "getAuth", "getIdToken", "getIdTokenResult", "getMultiFactorResolver", "getRedirectResult", "initializeAuth", "isSignInWithEmailLink", "linkWithCredential", "linkWithPhoneNumber", "linkWithPopup", "linkWithRedirect", "multiFactor", "onAuthStateChanged", "onIdTokenChanged", "parseActionCodeURL", "reauthenticateWithCredential", "reauthenticateWithPhoneNumber", "reauthenticateWithPopup", "reauthenticateWithRedirect", "reload", "sendEmailVerification", "sendPasswordResetEmail", "sendSignInLinkToEmail", "setPersistence", "signInAnonymously", "signInWithCredential", "signInWithCustomToken", "signInWithEmailAndPassword", "signInWithEmailLink", "signInWithPhoneNumber", "signInWithPopup", "signInWithRedirect", "signOut", "unlink", "updateCurrentUser", "updateEmail", "updatePassword", "updatePhoneNumber", "updateProfile", "useDeviceLanguage", "verifyBeforeUpdateEmail", "verifyPasswordResetCode", "ActionCodeOperation", "ActionCodeURL", "AuthCredential", "AuthErrorCodes", "browserLocalPersistence", "browserPopupRedirectResolver", "browserSessionPersistence", "debugErrorMap", "EmailAuthCredential", "EmailAuthProvider", "FacebookAuthProvider", "FactorId", "GithubAuthProvider", "GoogleAuthProvider", "indexedDBLocalPersistence", "inMemoryPersistence", "OAuthCredential", "OAuthProvider", "OperationType", "PhoneAuthCredential", "PhoneAuthProvider", "PhoneMultiFactorGenerator", "prodErrorMap", "ProviderId", "RecaptchaVerifier", "SAMLAuthProvider", "SignInMethod", "TwitterAuthProvider"], {
      debugErrorMap: null,
      inMemoryPersistence: null,
      browserLocalPersistence: null,
      browserSessionPersistence: null,
      indexedDBLocalPersistence: null,
      prodErrorMap: null,
    }),
    reexport('database', 'rxfire', 'rxfire/database', ["fromRef", "ListenEvent", "ListenerMethods", "stateChanges", "list", "listVal", "auditTrail", "object", "objectVal", "changeToData"]),
    reexport('database', 'firebase', 'firebase/database', ["child", "connectDatabaseEmulator", "enableLogging", "endAt", "endBefore", "equalTo", "forceLongPolling", "forceWebSockets", "get", "getDatabase", "goOffline", "goOnline", "increment", "limitToFirst", "limitToLast", "off", "onChildAdded", "onChildChanged", "onChildMoved", "onChildRemoved", "onDisconnect", "onValue", "orderByChild", "orderByKey", "orderByPriority", "orderByValue", "push", "query", "ref", "refFromURL", "remove", "runTransaction", "serverTimestamp", "set", "setPriority", "setWithPriority", "startAfter", "startAt", "update", "Database", "DataSnapshot", "OnDisconnect", "QueryConstraint", "TransactionResult"]),
    reexport('firestore', 'rxfire', 'rxfire/firestore', ["collectionChanges", "collection", "sortedChanges", "auditTrail", "collectionData", "doc", "docData", "snapToData", "fromRef"], {
      doc: { exportName: 'docSnapshots' },
      collection: { exportName: 'collectionSnapshots' },
    }),
    reexport('firestore', 'firebase', 'firebase/firestore', ["addDoc", "arrayRemove", "arrayUnion", "clearIndexedDbPersistence", "collection", "collectionGroup", "connectFirestoreEmulator", "deleteDoc", "deleteField", "disableNetwork", "doc", "documentId", "enableIndexedDbPersistence", "enableMultiTabIndexedDbPersistence", "enableNetwork", "endAt", "endBefore", "getDoc", "getDocFromCache", "getDocFromServer", "getDocs", "getDocsFromCache", "getDocsFromServer", "getFirestore", "increment", "initializeFirestore", "limit", "limitToLast", "loadBundle", "namedQuery", "onSnapshot", "onSnapshotsInSync", "orderBy", "query", "queryEqual", "refEqual", "runTransaction", "serverTimestamp", "setDoc", "setLogLevel", "snapshotEqual", "startAfter", "startAt", "terminate", "updateDoc", "waitForPendingWrites", "where", "writeBatch", "Bytes", "CACHE_SIZE_UNLIMITED", "CollectionReference", "DocumentReference", "DocumentSnapshot", "FieldPath", "FieldValue", "Firestore", "FirestoreError", "GeoPoint", "LoadBundleTask", "Query", "QueryConstraint", "QueryDocumentSnapshot", "QuerySnapshot", "SnapshotMetadata", "Timestamp", "Transaction", "WriteBatch"]),
    reexport('functions', 'rxfire', 'rxfire/functions', ["httpsCallable"], {
      httpsCallable: { exportName: 'httpsCallableData' },
    }),
    reexport('functions', 'firebase', 'firebase/functions', ["connectFunctionsEmulator", "getFunctions", "httpsCallable", "httpsCallableFromURL"]),
    reexport('messaging', 'firebase', 'firebase/messaging', ["deleteToken", "getMessaging", "getToken", "isSupported", "onMessage"], {
      onMessage: { blockUntilFirst: false },
      isSupported: { override: true },
    }),
    reexport('remote-config', 'rxfire', 'rxfire/remote-config', ["getValue", "getString", "getNumber", "getBoolean", "getAll"], {
      getValue: { exportName: 'getValueChanges' },
      getString: { exportName: 'getStringChanges' },
      getNumber: { exportName: 'getNumberChanges' },
      getBoolean: { exportName: 'getBooleanChanges' },
      getAll: { exportName: 'getAllChanges' },
    }),
    reexport('remote-config', 'firebase', 'firebase/remote-config', ["activate", "ensureInitialized", "fetchAndActivate", "fetchConfig", "getAll", "getBoolean", "getNumber", "getRemoteConfig", "getString", "getValue", "isSupported", "setLogLevel"], {
      isSupported: { override: true },
    }),
    reexport('storage', 'rxfire', 'rxfire/storage', ["fromTask", "getDownloadURL", "getMetadata", "uploadBytesResumable", "uploadString", "percentage"], {
      getDownloadURL: null,
      getMetadata: null,
      uploadBytesResumable: null,
      uploadString: null,
    }),
    reexport('storage', 'firebase', 'firebase/storage', ["connectStorageEmulator", "deleteObject", "getBlob", "getBytes", "getDownloadURL", "getMetadata", "getStorage", "getStream", "list", "listAll", "ref", "updateMetadata", "uploadBytes", "uploadBytesResumable", "uploadString", "StringFormat"]),
    reexport('performance', 'rxfire', 'rxfire/performance', ["getPerformance$", "trace", "traceUntil", "traceWhile", "traceUntilComplete", "traceUntilFirst"], {
      getPerformance$: null,
      trace: null,
    }),
    reexport('performance', 'firebase', 'firebase/performance', ["getPerformance", "initializePerformance", "trace"]),
    reexport('firestore/lite', 'rxfire', 'rxfire/firestore/lite', ["collection", "collectionData", "doc", "docData", "snapToData", "fromRef"], {
      doc: { exportName: 'docSnapshots' },
      collection: { exportName: 'collectionSnapshots' },
    }),
    reexport('firestore/lite', 'firebase', 'firebase/firestore/lite', ["addDoc", "arrayRemove", "arrayUnion", "collection", "collectionGroup", "connectFirestoreEmulator", "deleteDoc", "deleteField", "doc", "documentId", "endAt", "endBefore", "getDoc", "getDocs", "getFirestore", "increment", "initializeFirestore", "limit", "limitToLast", "orderBy", "query", "queryEqual", "refEqual", "runTransaction", "serverTimestamp", "setDoc", "setLogLevel", "snapshotEqual", "startAfter", "startAt", "terminate", "updateDoc", "where", "writeBatch", "Bytes", "CollectionReference", "DocumentReference", "DocumentSnapshot", "FieldPath", "FieldValue", "Firestore", "FirestoreError", "GeoPoint", "Query", "QueryConstraint", "QueryDocumentSnapshot", "QuerySnapshot", "Timestamp", "Transaction", "WriteBatch"]),
  ]);
}

function webpackFirestoreProtos() {
  return writeFile(dest('firestore-protos.js'), `/**
 * @deprecated No longer needed since Firebase JS SDK 9.6.3
 */
export {};`);
}

function proxyPolyfillCompat() {
  const defaultObject = {
    'compat/analytics': ["app", "logEvent", "setCurrentScreen", "setUserId", "setUserProperties", "setAnalyticsCollectionEnabled"],
    'compat/auth': ["name", "config", "emulatorConfig", "app", "applyActionCode", "checkActionCode", "confirmPasswordReset", "createUserWithEmailAndPassword", "currentUser", "fetchSignInMethodsForEmail", "isSignInWithEmailLink", "getRedirectResult", "languageCode", "settings", "onAuthStateChanged", "onIdTokenChanged", "sendSignInLinkToEmail", "sendPasswordResetEmail", "setPersistence", "signInAndRetrieveDataWithCredential", "signInAnonymously", "signInWithCredential", "signInWithCustomToken", "signInWithEmailAndPassword", "signInWithPhoneNumber", "signInWithEmailLink", "signInWithPopup", "signInWithRedirect", "signOut", "tenantId", "updateCurrentUser", "useDeviceLanguage", "useEmulator", "verifyPasswordResetCode"],
    'compat/functions': ["useEmulator", "useFunctionsEmulator", "httpsCallable"],
    'compat/messaging': ["deleteToken", "getToken", "onMessage", "onBackgroundMessage"],
    'compat/performance': ["app", "trace", "instrumentationEnabled", "dataCollectionEnabled"],
    'compat/remote-config': ["app", "settings", "defaultConfig", "fetchTimeMillis", "lastFetchStatus", "activate", "ensureInitialized", "fetch", "fetchAndActivate", "getAll", "getBoolean", "getNumber", "getString", "getValue", "setLogLevel"],
};
  return Promise.all(Object.keys(defaultObject).map(module =>
    writeFile(join(process.cwd(), 'src', `${module}/base.ts`), `// DO NOT MODIFY, this file is autogenerated by tools/build.ts
// Export a null object with the same keys as firebase/${module}, so Proxy can work with proxy-polyfill in Internet Explorer
export const proxyPolyfillCompat = {
${defaultObject[module].map(it => `  ${it}: null,`).join('\n')}
};\n`)
  ));
}

const src = (...args: string[]) => join(process.cwd(), 'src', ...args);
const dest = (...args: string[]) => join(process.cwd(), 'dist', '@angular/fire', ...args);

const rootPackage = import(join(process.cwd(), 'package.json'));

async function replacePackageCoreVersion() {
  const root = await rootPackage;
  const replace = require('replace-in-file');
  return replace({
    files: dest('**', '*'),
    from: 'ANGULARFIRE2_VERSION',
    to: root.version
  });
}

async function replaceSchematicVersions() {
  const root = await rootPackage;
  const path = dest('schematics', 'versions.json');
  const dependencies = await import(path);
  Object.keys(dependencies.peerDependencies).forEach(name => {
    dependencies.peerDependencies[name].version = root.dependencies[name] || root.devDependencies[name];
  });
  Object.keys(dependencies.firebaseFunctionsDependencies).forEach(name => {
    dependencies.firebaseFunctionsDependencies[name].version = root.dependencies[name] || root.devDependencies[name];
  });
  return writeFile(path, JSON.stringify(dependencies, null, 2));
}

function spawnPromise(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => spawn(command, args, { stdio: 'inherit' }).on('close', code => {
    if (code === 0) {
      resolve()
    } else {
      reject('Build failed.');
    }
  })
  .on('error', reject));
}

async function compileSchematics() {
  await spawnPromise(`npx`, ['tsc', '-p', src('schematics', 'tsconfig.json')]);
  return Promise.all([
    copy(src('schematics', 'builders.json'), dest('schematics', 'builders.json')),
    copy(src('schematics', 'collection.json'), dest('schematics', 'collection.json')),
    copy(src('schematics', 'migration.json'), dest('schematics', 'migration.json')),
    copy(src('schematics', 'deploy', 'schema.json'), dest('schematics', 'deploy', 'schema.json')),
    copy(src('schematics', 'add', 'schema.json'), dest('schematics', 'add', 'schema.json')),
    copy(src('schematics', 'setup', 'schema.json'), dest('schematics', 'setup', 'schema.json')),
    // replaceSchematicVersions()
  ]);
}

async function measure(module: string) {
  const path = dest('bundles', `${module}.umd.js`);
  const file = await readFile(path);
  const size = prettySize(file.byteLength, true);
  const gzip = prettySize(await gzipSizeFile(path), true);
  return { size, gzip };
}

async function fixImportForLazyModules() {
  await Promise.all(LAZY_MODULES.map(async module => {
    const packageJson = JSON.parse((await readFile(dest(module, 'package.json'))).toString());
    const entries = Array.from(new Set(Object.values(packageJson).filter(v => typeof v === 'string' && v.endsWith('.js')))) as string[];
    // TODO don't hardcode esm2015 here, perhaps we should scan all the entry directories
    //      e.g, if ng-packagr starts building other non-flattened entries we'll lose the dynamic import
    // TODO fix in Windows
    entries.push(`../${module.includes('/') ? '../' : ''}esm2015/${module}/public_api.js`);
    await Promise.all(entries.map(async path => {
      const source = (await readFile(dest(module, path))).toString();
      let newSource: string;
      if (path.endsWith('.umd.js')) {
        // in the UMD for lazy modules replace the dyanamic import
        newSource = source.replace(`import('firebase/${module}')`, 'rxjs.of(undefined)');
      } else {
        // in everything else get rid of the global side-effect import
        newSource = source.replace(new RegExp(`^import 'firebase/${module}'.+$`, 'gm'), '');
      }
      await writeFile(dest(module, path), newSource);
    }));
  }));
}

async function buildLibrary() {
  await proxyPolyfillCompat();
  await zoneWrapExports();
  await spawnPromise('npx', ['ng', 'build']);
  await Promise.all([
    copy(join(process.cwd(), '.npmignore'), dest('.npmignore')),
    copy(join(process.cwd(), 'README.md'), dest('README.md')),
    copy(join(process.cwd(), 'docs'), dest('docs')),
    compileSchematics(),
    // replacePackageCoreVersion(),
    // fixImportForLazyModules(),
    // webpackFirestoreProtos(),
  ]);
}

function measureLibrary() {
  return Promise.all(UMD_NAMES.map(measure));
}

buildLibrary().catch(err => {
  console.error(err);
  process.exit(1);
})
