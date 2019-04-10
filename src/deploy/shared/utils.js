"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const inquirer = require("inquirer");
const path_1 = require("path");
const firebase = require('firebase-tools');
const fuzzy = require('fuzzy');
function listProjects() {
    return firebase.list().catch(
    /* If list failed, then login and try again. */
    () => firebase.login().then(() => firebase.list()));
}
exports.listProjects = listProjects;
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
// `fuzzy` passes either the original list of projects or an internal object
// which contains the project as a property.
const isProject = (elem) => {
    return elem.original === undefined;
};
const searchProjects = (projects) => {
    return (_, input) => {
        return Promise.resolve(fuzzy
            .filter(input, projects, {
            extract(el) {
                return `${el.id} ${el.name} ${el.permission}`;
            }
        })
            .map((result) => {
            let original;
            if (isProject(result)) {
                original = result;
            }
            else {
                original = result.original;
            }
            return { name: `${original.id} (${original.name})`, title: original.name, value: original.id };
        }));
    };
};
exports.projectPrompt = (projects) => {
    return inquirer.prompt({
        type: 'autocomplete',
        name: 'firebaseProject',
        source: searchProjects(projects),
        message: 'Please select a project:'
    });
};
function getFirebaseProjectName(projectRoot, target) {
    const { targets } = JSON.parse(fs_1.readFileSync(path_1.join(projectRoot, '.firebaserc'), 'UTF-8'));
    const projects = Object.keys(targets);
    return projects.find(project => !!Object.keys(targets[project].hosting).find(t => t === target));
}
exports.getFirebaseProjectName = getFirebaseProjectName;
//# sourceMappingURL=utils.js.map