import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { FirebaseJSON, FirebaseRc } from '../shared/types';
import { experimental, JsonParseMode, parseJson } from '@angular-devkit/core';

const stringifyFormatted = (obj: any) => JSON.stringify(obj, null, 2);

function emptyFirebaseJson() {
    return {
        hosting: []
    }
}

function emptyFirebaseRc() {
    return {
        targets: {}
    };
}


function generateHostingConfig(project: string, dist: string) {
    return {
        target: project,
        public: dist,
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        rewrites: [
            {
                source: '**',
                destination: '/index.html'
            }
        ]
    }
}

function safeReadJSON(path: string, tree: Tree) {
    try {
        return JSON.parse(tree.read(path)!.toString())
    } catch (e) {
        throw new SchematicsException(`Error when parsing ${path}: ${e.message}`);
    }
}

function generateFirebaseJson(tree: Tree, path: string, project: string, dist: string) {
    let firebaseJson: FirebaseJSON = tree.exists(path) ? safeReadJSON(path, tree) : emptyFirebaseJson();

    if (firebaseJson.hosting.find(config => config.target === project)) {
        throw new SchematicsException(`Target ${project} already exists in firebase.json`);
    }

    firebaseJson.hosting.push(generateHostingConfig(project, dist));

    overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}


function generateFirebaseRcTarget(firebaseProject: string, project: string) {
    return {
        "hosting": {
            [project]: [
                // TODO(kirjs): Generally site name is consistent with the project name, but there are edge cases.
                firebaseProject
            ]
        }
    };
}

function generateFirebaseRc(tree: Tree, path: string, firebaseProject: string, project: string) {
    const firebaseRc: FirebaseRc = tree.exists(path) ? safeReadJSON(path, tree) : emptyFirebaseRc();


    if (firebaseProject in firebaseRc.targets) {
        throw new SchematicsException(`Firebase project ${firebaseProject} already defined in .firebaserc`);
    }

    firebaseRc.targets[firebaseProject] = generateFirebaseRcTarget(firebaseProject, project);

    overwriteIfExists(tree, path, stringifyFormatted(firebaseRc));
}

const overwriteIfExists = (tree: Tree, path: string, content: string) => {
    if (tree.exists(path)) tree.overwrite(path, content);
    else tree.create(path, content);
};

function getWorkspace(
    host: Tree,
): { path: string, workspace: experimental.workspace.WorkspaceSchema } {
    const possibleFiles = ['/angular.json', '/.angular.json'];
    const path = possibleFiles.filter(path => host.exists(path))[0];

    const configBuffer = host.read(path);
    if (configBuffer === null) {
        throw new SchematicsException(`Could not find angular.json`);
    }
    const content = configBuffer.toString();

    let workspace: experimental.workspace.WorkspaceSchema;
    try {
        workspace = parseJson(
            content,
            JsonParseMode.Loose,
        ) as {} as experimental.workspace.WorkspaceSchema;
    } catch (e) {
        throw new SchematicsException(`Could not parse angular.json: ` + e.message);
    }

    return {
        path,
        workspace,
    };
}


interface NgAddOptions {
    firebaseProject: string;
    project?: string;
}

export function ngAdd(tree: Tree, options: NgAddOptions) {
    const {path: workspacePath, workspace} = getWorkspace(tree);

    if (!options.project) {
        if (workspace.defaultProject) {
            options.project = workspace.defaultProject;
        } else {
            throw new SchematicsException('No project selected and no default project in the workspace');
        }
    }

    const project = workspace.projects[options.project];
    if (!project) {
        throw new SchematicsException('Project is not defined in this workspace');
    }

    if (project.projectType !== 'application') {
        throw new SchematicsException(`Deploy requires a project type of "application" in angular.json`);
    }

    if (!project.architect || !project.architect.build || !project.architect.build.options || !project.architect.build.options.outputPath) {
        throw new SchematicsException(`Cannot read the output path (architect.build.options.outputPath) of project "${options.project}" in angular.json`);
    }

    const outputPath = project.architect.build.options.outputPath;

    project.architect['deploy'] = {
        builder: 'ng-deploy:deploy',
        options: {}
    };

    tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
    generateFirebaseJson(tree, 'firebase.json', options.project, outputPath);
    generateFirebaseRc(tree, '.firebaserc', options.firebaseProject, options.project);
    return tree;
}
