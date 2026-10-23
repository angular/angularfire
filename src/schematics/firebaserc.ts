import { readFileSync } from "fs";
import { join } from "path";
import { FirebaseRc } from "./interfaces";

export const projectFromRc = (
  rc: FirebaseRc,
  target: string
): [string | undefined, string | undefined] => {
  const defaultProject = rc.projects?.default;
  const project = Object.keys(rc.targets || {}).find(
    (project) => !!rc.targets?.[project]?.hosting?.[target]
  );
  const site = project && rc.targets?.[project]?.hosting?.[target]?.[0];
  return [project || defaultProject, site];
};

export function getFirebaseProjectNameFromFs(
  root: string,
  target: string
): [string | undefined, string | undefined] {
  const path = join(root, ".firebaserc");
  try {
    const buffer = readFileSync(path);
    const rc: FirebaseRc = JSON.parse(buffer.toString());
    return projectFromRc(rc, target);
  } catch {
    return [undefined, undefined];
  }
}
