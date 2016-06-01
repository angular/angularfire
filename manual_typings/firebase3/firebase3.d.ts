/*

1. Delete goog namespaces
2. Delete look of disaproval
3. typealias firebase.Promise to Promise
4. Union type FirebaseOAuthProvider
5. Remove _noStructuralTyping from Promise classes
6. Remove catch() and then() declarations from firebase.Thenable, and extend Promise<t>.

*/
declare interface FirebaseService {
  INTERNAL: Object;
  app: firebase.app.App;
}

declare interface FirebaseServiceNamespace {
  app(app?: firebase.app.App): FirebaseService;
}

declare interface Observer {
  complete(): any;
  error(error: Object): any;
  next(value: any): any;
}


declare type FirebaseOAuthProvider = firebase.auth.GithubAuthProvider |
                                     firebase.auth.GoogleAuthProvider |
                                     firebase.auth.FacebookAuthProvider;

declare class Promise_Instance<TYPE> implements PromiseLike<TYPE> {
  constructor(resolver: (a: (a?: TYPE | PromiseLike<TYPE> | { then: any }) => any, b: (a?: any) => any) => any);
  catch<RESULT>(onRejected: (a: any) => RESULT): Promise<RESULT>;
  then<VALUE, RESULT>(opt_onFulfilled?: (a: TYPE) => VALUE, opt_onRejected?: (a: any) => any): RESULT;
}

declare namespace firebase {
  type AuthTokenData = { accessToken: string, expirationTime: number, refreshToken: string };
}
declare namespace firebase {
  type AuthTokenListener = (a: string) => void;
}
declare namespace firebase {
  type CompleteFn = () => void;
}
declare namespace firebase {
  type ErrorFn = (a: Object) => void;
}
declare namespace firebase {
  interface FirebaseError {
    code: string;
    message: string;
    name: string;
    stack: string;
  }
}
declare namespace firebase {
  type NextFn = (a: any) => void;
}
declare namespace firebase {
  class Promise<T> extends Promise_Instance<T> {
    static all(values: firebase.Promise<any>[]): firebase.Promise<any[]>;
    static reject(error: Object): firebase.Promise<any>;
    static resolve<T>(value: T): firebase.Promise<T>;
  }
  class Promise_Instance<T> implements firebase.Thenable<any> {
    constructor(resolver: (a?: (a: T) => void, b?: (a: Object) => void) => any);
    catch(onReject?: (a: Object) => any): firebase.Thenable<any>;
    then(onResolve?: (a: T) => any, onReject?: (a: Object) => any): firebase.Promise<any>;
  }
}
declare namespace firebase {
  var SDK_VERSION: string;
}
declare namespace firebase {
  type Subscribe = (a?: ((a: any) => void) | Observer, b?: (a: Object) => void, c?: () => void) => () => void;
}
declare namespace firebase {
  interface Thenable<T> extends Promise<T> {
    //Removed definitions of catch() and then(), and extended Promise.
  }
}
declare namespace firebase {
  type Unsubscribe = () => void;
}
declare namespace firebase {
  interface User extends firebase.UserInfo {
    delete(): firebase.Promise<void>;
    emailVerified: boolean;
    getToken(opt_forceRefresh?: boolean): firebase.Promise<string>;
    isAnonymous: boolean;
    link(credential: firebase.auth.AuthCredential): firebase.Promise<firebase.User>;
    linkWithPopup(provider: firebase.auth.AuthProvider): firebase.Promise<{ credential: firebase.auth.AuthCredential, user: firebase.User }>;
    linkWithRedirect(provider: firebase.auth.AuthProvider): firebase.Promise<void>;
    providerData: (firebase.UserInfo)[];
    reauthenticate(credential: firebase.auth.AuthCredential): firebase.Promise<void>;
    refreshToken: string;
    reload(): firebase.Promise<void>;
    sendEmailVerification(): firebase.Promise<void>;
    unlink(providerId: string): firebase.Promise<firebase.User>;
    updateEmail(newEmail: string): firebase.Promise<void>;
    updatePassword(newPassword: string): firebase.Promise<void>;
    updateProfile(profile: { displayName: string, photoURL: string }): firebase.Promise<void>;
  }
}
declare namespace firebase {
  interface UserInfo {
    displayName: string;
    email: string;
    photoURL: string;
    providerId: string;
    uid: string;
  }
}
declare namespace firebase {
  function app(name: string): firebase.app.App;
}
declare namespace firebase.app {
  interface App {
    INTERNAL: Object;
    auth(): firebase.auth.Auth;
    database(): firebase.database.Database;
    delete(): firebase.Promise<any>;
    name: string;
    options: Object;
    storage(): firebase.storage.Storage;
  }
}
declare namespace firebase {
  var apps: (firebase.app.App)[];
}
declare namespace firebase {
  function auth(app?: firebase.app.App): firebase.auth.Auth;
}
declare namespace firebase.auth {
  interface ActionCodeInfo {
  }
}
declare namespace firebase.auth {
  interface Auth {
    app: firebase.app.App;
    applyActionCode(code: string): firebase.Promise<void>;
    checkActionCode(code: string): firebase.Promise<firebase.auth.ActionCodeInfo>;
    confirmPasswordReset(code: string, newPassword: string): firebase.Promise<void>;
    createUserWithEmailAndPassword(email: string, password: string): firebase.Promise<firebase.User>;
    currentUser: firebase.User;
    fetchProvidersForEmail(email: string): firebase.Promise<string[]>;
    getRedirectResult(): firebase.Promise<{ credential: firebase.auth.AuthCredential, user: firebase.User }>;
    onAuthStateChanged(nextOrObserver: Object, opt_error?: (a: firebase.auth.Error) => any, opt_completed?: () => any): () => any;
    sendPasswordResetEmail(email: string): firebase.Promise<void>;
    signInAnonymously(): firebase.Promise<firebase.User>;
    signInWithCredential(credential: firebase.auth.AuthCredential): firebase.Promise<firebase.User>;
    signInWithCustomToken(token: string): firebase.Promise<firebase.User>;
    signInWithEmailAndPassword(email: string, password: string): firebase.Promise<firebase.User>;
    signInWithPopup(provider: firebase.auth.AuthProvider): firebase.Promise<{ credential: firebase.auth.AuthCredential, user: firebase.User }>;
    signInWithRedirect(provider: firebase.auth.AuthProvider): firebase.Promise<void>;
    signOut(): firebase.Promise<void>;
    verifyPasswordResetCode(code: string): firebase.Promise<string>;
  }
}
declare namespace firebase.auth {
  interface AuthCredential {
    provider: string;
  }
}
declare namespace firebase.auth {
  interface AuthProvider {
    providerId: string;
  }
}
declare namespace firebase.auth {
  class EmailAuthProvider extends EmailAuthProvider_Instance {
    static PROVIDER_ID: string;
  }
  class EmailAuthProvider_Instance implements firebase.auth.AuthProvider {
    private noStructuralTyping_: any;
    credential(email: string, password: string): firebase.auth.AuthCredential;
    providerId: string;
  }
}
declare namespace firebase.auth {
  interface Error {
    code: string;
    message: string;
  }
}
declare namespace firebase.auth {
  class FacebookAuthProvider extends FacebookAuthProvider_Instance {
    static PROVIDER_ID: string;
  }
  class FacebookAuthProvider_Instance implements firebase.auth.AuthProvider {
    private noStructuralTyping_: any;
    addScope(scope: string): any;
    credential(token: string): firebase.auth.AuthCredential;
    providerId: string;
  }
}
declare namespace firebase.auth {
  class GithubAuthProvider extends GithubAuthProvider_Instance {
    static PROVIDER_ID: string;
    // TODO fix upstream
    static credential(token: string): firebase.auth.AuthCredential;
  }
  class GithubAuthProvider_Instance implements firebase.auth.AuthProvider {
    private noStructuralTyping_: any;
    addScope(scope: string): any;
    providerId: string;
  }
}
declare namespace firebase.auth {
  class GoogleAuthProvider extends GoogleAuthProvider_Instance {
    static PROVIDER_ID: string;
  }
  class GoogleAuthProvider_Instance implements firebase.auth.AuthProvider {
    private noStructuralTyping_: any;
    addScope(scope: string): any;
    credential(idToken?: string, accessToken?: string): firebase.auth.AuthCredential;
    providerId: string;
  }
}
declare namespace firebase.auth {
  class TwitterAuthProvider extends TwitterAuthProvider_Instance {
    static PROVIDER_ID: string;
    // TODO fix this upstream
    static credential(token: string, secret: string): firebase.auth.AuthCredential;
  }
  class TwitterAuthProvider_Instance implements firebase.auth.AuthProvider {
    private noStructuralTyping_: any;
    providerId: string;
  }
}
declare namespace firebase.auth {
  type UserCredential = { credential: firebase.auth.AuthCredential, user: firebase.User };
}
declare namespace firebase {
  function database(app?: firebase.app.App): firebase.database.Database;
}
declare namespace firebase.database {
  interface DataSnapshot {
    child(path: string): firebase.database.DataSnapshot;
    exists(): boolean;
    exportVal(): any;
    forEach(action: (a: firebase.database.DataSnapshot) => boolean): boolean;
    getPriority(): string | number;
    hasChild(path: string): boolean;
    hasChildren(): boolean;
    key: string;
    numChildren(): number;
    ref: firebase.database.Reference;
    val(): any;
  }
}
declare namespace firebase.database {
  interface Database {
    app: firebase.app.App;
    goOffline(): any;
    goOnline(): any;
    ref(path?: string): firebase.database.Reference;
    refFromURL(url: string): firebase.database.Reference;
  }
}
declare namespace firebase.database {
  interface OnDisconnect {
    cancel(onComplete?: (a: Object) => any): firebase.Promise<void>;
    remove(onComplete?: (a: Object) => any): firebase.Promise<void>;
    set(value: any, onComplete?: (a: Object) => any): firebase.Promise<void>;
    setWithPriority(value: any, priority: number | string, onComplete?: (a: Object) => any): firebase.Promise<void>;
    update(values: Object, onComplete?: (a: Object) => any): firebase.Promise<void>;
  }
}
declare namespace firebase.database {
  interface Query {
    endAt(value: number | string | boolean, key?: string): firebase.database.Query;
    equalTo(value: number | string | boolean, key?: string): firebase.database.Query;
    limitToFirst(limit: number): firebase.database.Query;
    limitToLast(limit: number): firebase.database.Query;
    off(eventType?: string, callback?: (a: firebase.database.DataSnapshot, b?: string) => any, context?: Object): any;
    on(eventType: string, callback: (a: firebase.database.DataSnapshot, b?: string) => any, cancelCallbackOrContext?: Object, context?: Object): (a: firebase.database.DataSnapshot, b?: string) => any;
    once(eventType: string, callback?: (a: firebase.database.DataSnapshot, b?: string) => any): firebase.Promise<any>;
    orderByChild(path: string): firebase.database.Query;
    orderByKey(): firebase.database.Query;
    orderByPriority(): firebase.database.Query;
    orderByValue(): firebase.database.Query;
    ref: firebase.database.Reference;
    startAt(value: number | string | boolean, key?: string): firebase.database.Query;
    toString(): string;
  }
}
declare namespace firebase.database {
  interface Reference extends firebase.database.Query {
    child(path: string): firebase.database.Reference;
    key: string;
    onDisconnect(): firebase.database.OnDisconnect;
    parent: firebase.database.Reference;
    push(value?: any, onComplete?: (a: Object) => any): firebase.database.ThenableReference;
    remove(onComplete?: (a: Object) => any): firebase.Promise<void>;
    root: firebase.database.Reference;
    set(value: any, onComplete?: (a: Object) => any): firebase.Promise<void>;
    setPriority(priority: string | number, onComplete: (a: Object) => any): firebase.Promise<void>;
    setWithPriority(newVal: any, newPriority: string | number, onComplete?: (a: Object) => any): firebase.Promise<void>;
    transaction(transactionUpdate: (a: any) => any, onComplete?: (a: Object, b: boolean, c: firebase.database.DataSnapshot) => any, applyLocally?: boolean): firebase.Promise<{ committed: boolean, snapshot: firebase.database.DataSnapshot }>;
    update(values: Object, onComplete?: (a: Object) => any): firebase.Promise<void>;
  }
}
declare namespace firebase.database.ServerValue {
}
declare namespace firebase.database {
  interface ThenableReference extends firebase.database.Reference, firebase.Thenable<void> {
  }
}
declare namespace firebase.database {
  function enableLogging(logger?: any, persistent?: boolean): any;
}
declare namespace firebase {
  function initializeApp(options: Object, name?: string): firebase.app.App;
}
declare namespace firebase {
  function storage(app?: firebase.app.App): firebase.storage.Storage;
}
declare namespace firebase.storage {
  interface FullMetadata extends firebase.storage.UploadMetadata {
    bucket: string;
    downloadURLs: string[];
    fullPath: string;
    generation: string;
    metageneration: string;
    name: string;
    size: number;
    timeCreated: string;
    updated: string;
  }
}
declare namespace firebase.storage {
  interface Reference {
    bucket: string;
    child(path: string): firebase.storage.Reference;
    delete(): Promise<void>;
    fullPath: string;
    getDownloadURL(): Promise<string>;
    getMetadata(): Promise<firebase.storage.FullMetadata>;
    name: string;
    parent: firebase.storage.Reference;
    put(blob: Blob, metadata?: firebase.storage.UploadMetadata): firebase.storage.UploadTask;
    root: firebase.storage.Reference;
    storage: firebase.storage.Storage;
    toString(): string;
    updateMetadata(metadata: firebase.storage.SettableMetadata): Promise<firebase.storage.FullMetadata>;
  }
}
declare namespace firebase.storage {
  interface SettableMetadata {
    cacheControl: string;
    contentDisposition: string;
    contentEncoding: string;
    contentLanguage: string;
    contentType: string;
    customMetadata: { [key: string]: string };
  }
}
declare namespace firebase.storage {
  interface Storage {
    app: firebase.app.App;
    maxOperationRetryTime: number;
    maxUploadRetryTime: number;
    ref(path?: string): firebase.storage.Reference;
    refFromURL(url: string): firebase.storage.Reference;
    setMaxOperationRetryTime(time: number): any;
    setMaxUploadRetryTime(time: number): any;
  }
}
declare namespace firebase.storage {
  type TaskEvent = string;
  var TaskEvent: {
    STATE_CHANGED: TaskEvent,
  };
}
declare namespace firebase.storage {
  type TaskState = string;
  var TaskState: {
    CANCELED: TaskState,
    ERROR: TaskState,
    PAUSED: TaskState,
    RUNNING: TaskState,
    SUCCESS: TaskState,
  };
}
declare namespace firebase.storage {
  interface UploadMetadata extends firebase.storage.SettableMetadata {
    md5Hash: string;
  }
}
declare namespace firebase.storage {
  interface UploadTask {
    cancel(): boolean;
    on(event: firebase.storage.TaskEvent, nextOrObserver?: Object, error?: (a: Object) => any, complete?: () => any): (...a: any[]) => any;
    pause(): boolean;
    resume(): boolean;
    snapshot: firebase.storage.UploadTaskSnapshot;
  }
}
declare namespace firebase.storage {
  interface UploadTaskSnapshot {
    bytesTransferred: number;
    downloadURL: string;
    metadata: firebase.storage.FullMetadata;
    ref: firebase.storage.Reference;
    state: firebase.storage.TaskState;
    task: firebase.storage.UploadTask;
    totalBytes: number;
  }
}

declare module 'firebase' {
  export = firebase;
}
