import { Project } from './types';
export declare function listProjects(): any;
export declare const projectPrompt: (projects: Project[]) => any;
export declare function getFirebaseProjectName(projectRoot: string, target: string): string | undefined;
