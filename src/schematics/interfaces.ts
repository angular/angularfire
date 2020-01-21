export interface Project {
  projectId: string;
  projectNumber: string;
  displayName: string;
  name: string;
  resources: { [key:string]: string }
}

export interface FirebaseDeployConfig {
  cwd: string;
  only?: string;
}

export interface FirebaseTools {
  login(): Promise<void>;

  projects: {
    list(): Promise<Project[]>;
  }

  deploy(config: FirebaseDeployConfig): Promise<any>;

  use(options: any, lol: any): Promise<any>;
}

export interface FirebaseHostingRewrite {
  source: string;
  destination: string;
}

export interface FirebaseHostingConfig {
  public: string;
  ignore: string[];
  target: string;
  rewrites: FirebaseHostingRewrite[];
}

export interface FirebaseJSON {
  hosting?: FirebaseHostingConfig[] | FirebaseHostingConfig;
}

export interface FirebaseRcTarget {
  hosting: Record<string, string[]>;
}

export interface FirebaseRc {
  targets?: Record<string, FirebaseRcTarget>;
}

export interface DeployBuilderSchema {
  buildTarget?: string;
}
