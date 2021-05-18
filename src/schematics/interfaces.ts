import { RuntimeOptions } from 'firebase-functions';

export interface Project {
  projectId: string;
  projectNumber: string;
  displayName: string;
  name: string;
  resources: { [key: string]: string };
}

export interface FirebaseDeployConfig {
  cwd: string;
  only?: string;
  token?: string;
}

export interface FirebaseTools {
  projects: {
    list(): Promise<Project[]>;
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

  login(): Promise<void>;

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
}

export interface DeployBuilderSchema {
  buildTarget?: string;
  firebaseProject?: string;
  preview?: boolean;
  universalBuildTarget?: string;
  ssr?: boolean;
  functionsNodeVersion?: number;
  functionsRuntimeOptions?: RuntimeOptions;
}

export interface BuildTarget {
  name: string;
  options?: {[name: string]: any};
}

export interface FSHost {
  moveSync(src: string, dest: string): void;
  writeFileSync(src: string, data: string): void;
  renameSync(src: string, dest: string): void;
}

export interface WorkspaceProject {
  projectType?: string;
  architect?: Record<string, { builder: string; options?: Record<string, any> }>;
}

export interface Workspace {
  defaultProject?: string;
  projects: Record<string, WorkspaceProject>;
}
