import { readFileSync } from "fs";
import * as inquirer from "inquirer";
import { FirebaseRc, Project } from "./interfaces";
import { join } from "path";

const firebase = require("firebase-tools");

const fuzzy = require("fuzzy");

export function listProjects() {
  return firebase.list().catch(
    /* If list failed, then login and try again. */
    () => firebase.login().then(() => firebase.list())
  );
}

inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);

// `fuzzy` passes either the original list of projects or an internal object
// which contains the project as a property.
const isProject = (elem: Project | { original: Project }): elem is Project => {
  return (<{ original: Project }>elem).original === undefined;
};

const searchProjects = (projects: Project[]) => {
  return (_: any, input: string) => {
    return Promise.resolve(
      fuzzy
        .filter(input, projects, {
          extract(el: Project) {
            return `${el.id} ${el.name} ${el.permission}`;
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
            name: `${original.id} (${original.name})`,
            title: original.name,
            value: original.id
          };
        })
    );
  };
};

export const projectPrompt = (projects: Project[]) => {
  return (inquirer as any).prompt({
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
