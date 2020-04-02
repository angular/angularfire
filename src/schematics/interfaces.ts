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
}

export interface FirebaseTools {
  projects: {
    list(): Promise<Project[]>;
  };

  login(): Promise<void>;

  deploy(config: FirebaseDeployConfig): Promise<any>;

  serve(options: any): Promise<any>;

  use(options: any, lol: any): Promise<any>;
  
  logger: {
    add(...args: any[]): any
  };
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

export interface FirebaseFunctionsConfig { [key:string]: any }

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
  preview?: boolean;
  universalBuildTarget?: string;
  ssr?: boolean;
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
