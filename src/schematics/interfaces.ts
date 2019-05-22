export interface Project {
  name: string;
  id: string;
  permission: "edit" | "view" | "own";
}

export interface FirebaseDeployConfig {
  cwd: string;
  only?: string;
}

export interface FirebaseTools {
  login(): Promise<void>;

  list(): Promise<Project[]>;

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
  hosting: FirebaseHostingConfig[];
}

export interface FirebaseRcTarget {
  hosting: Record<string, string[]>;
}

export interface FirebaseRc {
  targets: Record<string, FirebaseRcTarget>;
}
