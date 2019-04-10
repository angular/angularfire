"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const stringifyFormatted = (obj) => JSON.stringify(obj, null, 2);
function emptyFirebaseJson() {
    return {
        hosting: []
    };
}
function emptyFirebaseRc() {
    return {
        targets: {}
    };
}
function generateHostingConfig(project, dist) {
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
    };
}
function safeReadJSON(path, tree) {
    try {
        return JSON.parse(tree.read(path).toString());
    }
    catch (e) {
        throw new schematics_1.SchematicsException(`Error when parsing ${path}: ${e.message}`);
    }
}
function generateFirebaseJson(tree, path, project, dist) {
    let firebaseJson = tree.exists(path) ? safeReadJSON(path, tree) : emptyFirebaseJson();
    if (firebaseJson.hosting.find(config => config.target === project)) {
        throw new schematics_1.SchematicsException(`Target ${project} already exists in firebase.json`);
    }
    firebaseJson.hosting.push(generateHostingConfig(project, dist));
    overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}
function generateFirebaseRcTarget(firebaseProject, project) {
    return {
        "hosting": {
            [project]: [
                // TODO(kirjs): Generally site name is consistent with the project name, but there are edge cases.
                firebaseProject
            ]
        }
    };
}
function generateFirebaseRc(tree, path, firebaseProject, project) {
    const firebaseRc = tree.exists(path) ? safeReadJSON(path, tree) : emptyFirebaseRc();
    if (firebaseProject in firebaseRc.targets) {
        throw new schematics_1.SchematicsException(`Firebase project ${firebaseProject} already defined in .firebaserc`);
    }
    firebaseRc.targets[firebaseProject] = generateFirebaseRcTarget(firebaseProject, project);
    overwriteIfExists(tree, path, stringifyFormatted(firebaseRc));
}
const overwriteIfExists = (tree, path, content) => {
    if (tree.exists(path))
        tree.overwrite(path, content);
    else
        tree.create(path, content);
};
function getWorkspace(host) {
    const possibleFiles = ['/angular.json', '/.angular.json'];
    const path = possibleFiles.filter(path => host.exists(path))[0];
    const configBuffer = host.read(path);
    if (configBuffer === null) {
        throw new schematics_1.SchematicsException(`Could not find angular.json`);
    }
    const content = configBuffer.toString();
    let workspace;
    try {
        workspace = core_1.parseJson(content, core_1.JsonParseMode.Loose);
    }
    catch (e) {
        throw new schematics_1.SchematicsException(`Could not parse angular.json: ` + e.message);
    }
    return {
        path,
        workspace,
    };
}
function ngAdd(tree, options) {
    const { path: workspacePath, workspace } = getWorkspace(tree);
    if (!options.project) {
        if (workspace.defaultProject) {
            options.project = workspace.defaultProject;
        }
        else {
            throw new schematics_1.SchematicsException('No project selected and no default project in the workspace');
        }
    }
    const project = workspace.projects[options.project];
    if (!project) {
        throw new schematics_1.SchematicsException('Project is not defined in this workspace');
    }
    if (project.projectType !== 'application') {
        throw new schematics_1.SchematicsException(`Deploy requires a project type of "application" in angular.json`);
    }
    if (!project.architect || !project.architect.build || !project.architect.build.options || !project.architect.build.options.outputPath) {
        throw new schematics_1.SchematicsException(`Cannot read the output path (architect.build.options.outputPath) of project "${options.project}" in angular.json`);
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
exports.ngAdd = ngAdd;
//# sourceMappingURL=ng-add.js.map