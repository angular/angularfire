import { readFileSync } from "fs";
import { FirebaseRc, Project } from "./interfaces";
import { join } from "path";

export async function listProjects() {
  const firebase = require('firebase-tools');
  await firebase.login();
  return firebase.projects.list();
}

// `fuzzy` passes either the original list of projects or an internal object
// which contains the project as a property.
const isProject = (elem: Project | { original: Project }): elem is Project => {
  return (<{ original: Project }>elem).original === undefined;
};

const searchProjects = (projects: Project[]) => {
  return (_: any, input: string) => {
    return Promise.resolve(
      require('fuzzy')
        .filter(input, projects, {
          extract(el: Project) {
            return `${el.projectId} ${el.displayName}`;
          }
        })
        .map((result: Project | { original: Project }) => {
          let original: Project;
          if (isProject(result)) {
            original = result;
          } else {
            original = result.original;
          }
          return {
            name: `${original.displayName} (${original.projectId})`,
            title: original.displayName,
            value: original.projectId
          };
        })
    );
  };
};

export const projectPrompt = (projects: Project[]) => {
  const inquirer = require('inquirer');
  inquirer.registerPrompt(
    "autocomplete",
    require("inquirer-autocomplete-prompt")
  );
  return inquirer.prompt({
    type: "autocomplete",
    name: "firebaseProject",
    source: searchProjects(projects),
    message: "Please select a project:"
  });
};

export function getFirebaseProjectName(
  projectRoot: string,
  target: string
): string | undefined {
  const { targets }: FirebaseRc = JSON.parse(
    readFileSync(join(projectRoot, ".firebaserc"), "UTF-8")
  );
  const projects = Object.keys(targets!);
  return projects.find(
    project => !!Object.keys(targets![project].hosting).find(t => t === target)
  );
}
