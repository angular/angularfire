import type { HttpsOptions } from 'firebase-functions/https';

export const enum FEATURES {
  Authentication,
  Analytics,
  AppCheck,
  Database,
  DataConnect,
  Functions,
  Messaging,
  Performance,
  Firestore,
  Storage,
  RemoteConfig,
  AI,
}

export const featureOptions = [
  { name: 'Authentication', value: FEATURES.Authentication },
  { name: 'Google Analytics', value: FEATURES.Analytics },
  { name: 'App Check', value: FEATURES.AppCheck },
  { name: 'Firestore', value: FEATURES.Firestore },
  { name: 'Realtime Database', value: FEATURES.Database },
  { name: 'Data Connect', value: FEATURES.DataConnect },
  { name: 'Cloud Functions (callable)', value: FEATURES.Functions },
  { name: 'Cloud Messaging', value: FEATURES.Messaging },
  { name: 'Performance Monitoring', value: FEATURES.Performance },
  { name: 'Cloud Storage', value: FEATURES.Storage },
  { name: 'Remote Config', value: FEATURES.RemoteConfig },
  { name: 'AI Logic', value: FEATURES.AI },
];

export const enum PROJECT_TYPE { Static, CloudFunctions, CloudRun, WebFrameworks }

export interface NgAddOptions {
  firebaseProject: string;
  project?: string;
}

export interface NgAddNormalizedOptions {
  project: string;
  firebaseProject: FirebaseProject;
  firebaseApp: FirebaseApp|undefined;
  firebaseHostingSite: FirebaseHostingSite|undefined;
  sdkConfig: Record<string, string>|undefined;
  buildTarget: [string,string]|undefined;
  serveTarget: [string,string]|undefined;
  ssrRegion: string|undefined;
}

/** Where `ng add` sets up `ng deploy` to deploy to. `none` writes no deploy target. */
export type DeployChoice = 'apphosting' | 'hosting' | 'none';

export interface DeployOptions {
  project?: string;
  deploy?: DeployChoice;
}

export interface FirebaseProject {
  projectId: string;
  projectNumber: string;
  displayName: string;
  name: string;
  resources: Record<string, string>;
  state: string;
}

export interface FirebaseDeployConfig {
  cwd: string;
  only?: string;
  token?: string;
  [key: string]: any;
}

export interface FirebaseApp {
  name: string;
  displayName: string;
  platform: string;
  appId: string;
  namespace: string;
}

export interface FirebaseHostingSite {
  name: string;
  defaultUrl: string;
  type: string;
  appId: string|undefined;
}

export interface FirebaseSDKConfig {
  fileName: string;
  fileContents: string;
  sdkConfig: Record<string, string>;
}

/**
 * The options this package passes to Firebase CLI commands it calls as library functions.
 * Build a new object for every call. The Firebase CLI adds fields of its own to the object it is
 * given, and a later call fails on an object that already has them.
 */
export interface FirebaseToolsCommandOptions {
  /** The Firebase project id to act on. */
  project?: string;
  /** The workspace root. The Firebase CLI itself looks for firebase.json from `cwd` or the current directory. */
  projectRoot?: string;
  cwd?: string;
  /** The email of the signed-in account to act as. */
  account?: string;
  /** A CI token to authenticate with, in place of a signed-in account. */
  token?: string;
  /** True stops the Firebase CLI from asking the user questions of its own. */
  nonInteractive?: boolean;
}

/** What the Firebase CLI needs to create an App Hosting backend without asking questions. */
export interface AppHostingBackendCreateOptions extends FirebaseToolsCommandOptions {
  /** The id of the new backend. */
  backend: string;
  /** The Google Cloud region the backend runs in, such as `us-central1`. */
  primaryRegion: string;
  /** The directory holding the app's package.json, relative to the uploaded workspace. */
  rootDir: string;
  /** The id of the Firebase web app the backend is linked to. */
  app: string;
}

/**
 * A Firebase App Hosting backend, as the Firebase CLI's backend commands return it. A backend is
 * what App Hosting deploys an app to. App Hosting builds the app from its source in Google Cloud
 * and runs the app's Node.js server there, on Cloud Run, in the backend's region.
 */
export interface AppHostingBackend {
  /** `projects/<project>/locations/<region>/backends/<backendId>` */
  name: string;
  /** The backend's address, without `https://`. */
  uri?: string;
  /** Present when the backend deploys from a linked GitHub repository. */
  codebase?: { repository?: string };
}

export interface FirebaseTools {
  projects: {
    list(options: any): Promise<FirebaseProject[]>;
    create(projectId: string|undefined, options: any): Promise<FirebaseProject>;
  };

  apps: {
    list(platform: string|undefined, options: any): Promise<FirebaseApp[]>;
    create(platform: string, displayName: string|undefined, options: any): Promise<FirebaseApp>;
    sdkconfig(type: string, projectId: string, options: any): Promise<FirebaseSDKConfig>;
  };

  hosting: {
    sites: {
      list(options: any): Promise<{ sites: FirebaseHostingSite[]}>;
      create(siteId: string, options: any): Promise<FirebaseHostingSite>;
    }
  };

  /** Missing when firebase-tools predates App Hosting or has its `apphosting` experiment off. */
  apphosting?: {
    backends: {
      list(options: FirebaseToolsCommandOptions): Promise<AppHostingBackend[]>;
      create(options: AppHostingBackendCreateOptions): Promise<unknown>;
      get(backendId: string, options: FirebaseToolsCommandOptions): Promise<AppHostingBackend | undefined>;
    }
  };

  logger: {
    // firebase-tools v8
    add: (...args: any[]) => any
    // firebase-tools v9
    logger: {
      add: (...args: any[]) => any;
    }
  };

  cli: {
    version(): string;
  };

  login: {
    list(): Promise<{user: Record<string, any>}[] | { users: undefined }>;
    add(): Promise<Record<string, any>>;
    use(email: string, options?: unknown): Promise<string>;
  } & ((options?: unknown) => Promise<Record<string, any> | undefined>);

  deploy(config: FirebaseDeployConfig): Promise<any>;

  serve(options: any): Promise<any>;

  use(options: any, lol: any): Promise<any>;

  init(feature: string, options: any): Promise<any>;
}

export interface FirebaseHostingRewrite {
  source: string;
  destination?: string;
  function?: string;
}

export interface FirebaseHostingConfig {
  public?: string;
  ignore?: string[];
  target?: string;
  site?: string;
  rewrites?: FirebaseHostingRewrite[];
  /** Written by AngularFire before 17.1. Firebase's web frameworks integration, which `public` replaces. */
  source?: string;
  frameworksBackend?: unknown;
}

export type FirebaseFunctionsConfig = Record<string, any>;

export interface DataConnectConfig {
  source?: string;
}

export interface FirebaseFirestoreConfig {
  rules?: string;
  indexes?: string;
}

/** One App Hosting backend as listed under `apphosting` in firebase.json. */
export interface FirebaseAppHostingConfig {
  /** The id of the backend that this entry holds the settings for. */
  backendId: string;
  /** The directory holding the app's package.json, relative to firebase.json. */
  rootDir?: string;
  /** Paths left out of the upload. */
  ignore?: string[];
  /**
   * False makes the Firebase CLI skip the backend `backendId` when it deploys. True tells the CLI
   * that uploading local files to that backend is intended although it is connected to a GitHub
   * repository.
   */
  alwaysDeployFromSource?: boolean;
}

export interface FirebaseJSON {
  hosting?: FirebaseHostingConfig[] | FirebaseHostingConfig;
  apphosting?: FirebaseAppHostingConfig[] | FirebaseAppHostingConfig;
  functions?: FirebaseFunctionsConfig;
  firestore?: FirebaseFirestoreConfig;
  dataconnect?: DataConnectConfig;
}

export interface FirebaseRcTarget {
  hosting?: Record<string, string[]>;
}

export interface FirebaseRc {
  targets?: Record<string, FirebaseRcTarget>;
  projects?: Record<string, string>;
}

export interface DeployBuilderSchema {
  buildTarget?: string;
  browserTarget?: string;
  firebaseProject?: string;
  firebaseHostingSite?: string;
  preview?: boolean;
  target?: boolean;
  universalBuildTarget?: string;
  serverTarget?: string;
  prerenderTarget?: string;
  ssr?: boolean | string;
  region?: string;
  prerender?: boolean;
  functionName?: string;
  functionsNodeVersion?: number|string;
  /** @deprecated Read only by the Cloud Functions mode, which will be removed in AngularFire 23. */
  functionsRuntimeOptions?: HttpsOptions;
  cloudRunOptions?: Partial<CloudRunOptions>;
  outputPath?: string;
  /** @deprecated Read only by the Cloud Functions mode, which will be removed in AngularFire 23. */
  CF3v2?: boolean;
  version?: number;
  /** The App Hosting backend to deploy to. When set, `ng deploy` deploys there instead of to Hosting. */
  appHostingBackend?: string;
}

export interface CloudRunOptions {
  cpus: number;
  maxConcurrency: number | 'default';
  maxInstances: number | 'default';
  memory: string;
  minInstances: number | 'default';
  timeout: number;
  vpcConnector: string;
}

export interface BuildTarget {
  name: string;
  options?: Record<string, any>;
}

export interface FSHost {
  moveSync(src: string, dest: string): void;
  writeFileSync(src: string, data: string): void;
  renameSync(src: string, dest: string): void;
  copySync(src: string, dest: string): void;
  removeSync(src: string): void;
  existsSync(src: string): boolean;
}

export interface WorkspaceProject {
  root: string;
  sourceRoot?: string;
  projectType?: string;
  architect?: Record<string, {
    builder: string;
    options?: Record<string, any>,
    configurations?: Record<string, Record<string, any>>,
    defaultConfiguration?: string,
  }>;
}

export interface Workspace {
  defaultProject?: string;
  projects: Record<string, WorkspaceProject>;
}

export interface ConnectorConfig {
  location: string;
  connector: string;
  service: string;
}
export interface ConnectorYaml {
  connectorId: string;
  generate?: {
    javascriptSdk?: {
      package: string;
      outputDir: string;
      packageJsonDir?: string;
      angular?: boolean;
    }
  }
}
export interface DataConnectYaml {
  location: string;
  serviceId: string;
  connectorDirs: string[];
}
export interface DataConnectConnectorConfig  {
  connectorYaml: ConnectorYaml;
  connectorConfig?: ConnectorConfig;
  angular?: boolean;
  package?: string;
}

export interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}
