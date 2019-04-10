"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index2_1 = require("@angular-devkit/architect/src/index2");
const node_1 = require("@angular-devkit/core/node");
const deploy_1 = require("./actions/deploy");
const core_1 = require("@angular-devkit/core");
const utils_1 = require("../shared/utils");
// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
exports.default = index2_1.createBuilder((_, context) => __awaiter(this, void 0, void 0, function* () {
    // The project root is added to a BuilderContext.
    const root = core_1.normalize(context.workspaceRoot);
    const workspace = new core_1.experimental.workspace.Workspace(root, new node_1.NodeJsSyncHost());
    yield workspace.loadWorkspaceFromHost(core_1.normalize('angular.json')).toPromise();
    if (!context.target) {
        throw new Error('Cannot deploy the application without a target');
    }
    const project = workspace.getProject(context.target.project);
    const firebaseProject = utils_1.getFirebaseProjectName(workspace.root, context.target.project);
    try {
        yield deploy_1.default(require('firebase-tools'), context, core_1.join(workspace.root, project.root), firebaseProject);
    }
    catch (e) {
        console.error('Error when trying to deploy: ');
        console.error(e.message);
        return { success: false };
    }
    return { success: true };
}));
//# sourceMappingURL=builder.js.map