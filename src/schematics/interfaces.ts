import { RuntimeOptions } from 'firebase-functions';

export const enum FEATURES {
  Hosting,
  Authentication,
  Analytics,
  Database,
  Functions,
  Messaging,
  Performance,
  Firestore,
  Storage,
  RemoteConfig,
}

export const featureOptions = [
  { name: 'ng deploy -- hosting', value: FEATURES.Hosting },
  { name: 'Authentication', value: FEATURES.Authentication },
  { name: 'Firestore', value: FEATURES.Firestore },
  { name: 'Realtime Database', value: FEATURES.Database },
  { name: 'Analytics', value: FEATURES.Analytics },
  { name: 'Cloud Functions (callable)', value: FEATURES.Functions },
  { name: 'Cloud Messaging', value: FEATURES.Messaging },
  { name: 'Performance Monitoring', value: FEATURES.Performance },
  { name: 'Cloud Storage', value: FEATURES.Storage },
  { name: 'Remote Config', value: FEATURES.RemoteConfig },
];

export const enum PROJECT_TYPE { Static, CloudFunctions, CloudRun }

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
  prerender: boolean;
  browserTarget: string|undefined;
  serverTarget: string|undefined;
  prerenderTarget: string|undefined;
}

export interface DeployOptions {
  project: string;
}

export interface FirebaseProject {
  projectId: string;
  projectNumber: string;
  displayName: string;
  name: string;
  resources: { [key: string]: string };
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
  sdkConfig: { [key: string]: string };
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
    list(): Promise<{user: Record<string, any>}[]>;
    add(): Promise<Record<string, any>>;
    use(email: string, options?: {}): Promise<string>;
  } & ((options?: {}) => Promise<Record<string, any>>);

  deploy(config: FirebaseDeployConfig): Promise<any>;

  serve(options: any): Promise<any>;

  use(options: any, lol: any): Promise<any>;
}

export interface FirebaseHostingRewrite {
  source: string;
  destination?: string;
  function?: string;
}

export interface FirebaseHostingConfig {
  public?: string;
  ignore: string[];
  target: string;
  rewrites: FirebaseHostingRewrite[];
}

export interface FirebaseFunctionsConfig { [key: string]: any; }

export interface FirebaseJSON {
  hosting?: FirebaseHostingConfig[] | FirebaseHostingConfig;
  functions?: FirebaseFunctionsConfig;
}

export interface FirebaseRcTarget {
  hosting: Record<string, string[]>;
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
  universalBuildTarget?: string;
  serverTarget?: string;
  prerenderTarget?: string;
  ssr?: boolean | string;
  region?: string;
  prerender?: boolean;
  functionName?: string;
  functionsNodeVersion?: number|string;
  functionsRuntimeOptions?: RuntimeOptions;
  cloudRunOptions?: Partial<CloudRunOptions>;
  outputPath?: string;
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
  options?: {[name: string]: any};
}

export interface FSHost {
  moveSync(src: string, dest: string): void;
  writeFileSync(src: string, data: string): void;
  renameSync(src: string, dest: string): void;
  copySync(src: string, dest: string): void;
  removeSync(src: string): void;
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
