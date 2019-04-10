"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const ng_add_1 = require("./ng-add");
const utils_1 = require("../shared/utils");
// You don't have to export the function as default. You can also have more than one rule factory
// per file.
function ngDeploy({ project }) {
    return (host) => {
        return rxjs_1.from(utils_1.listProjects().then((projects) => {
            return utils_1.projectPrompt(projects).then(({ firebaseProject }) => {
                return ng_add_1.ngAdd(host, { firebaseProject, project });
            });
        }));
    };
}
exports.ngDeploy = ngDeploy;
//# sourceMappingURL=index.js.map