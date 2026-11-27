import { readFileSync } from "fs";
import { join } from "path";
import { FirebaseRc } from "./interfaces";

/**
 * The Firebase projects under which `.firebaserc` gives the Hosting target name `target` a site,
 * in the order the file lists them.
 */
export const projectsWithHostingTarget = (rc: FirebaseRc, target: string): string[] =>
  Object.keys(rc.targets ?? {}).filter(project => !!rc.targets?.[project]?.hosting?.[target]);

/** The Hosting site `.firebaserc` gives the target name `target` in the Firebase project `project`. */
export const hostingSiteFromRc = (rc: FirebaseRc, project: string, target: string): string | undefined =>
  rc.targets?.[project]?.hosting?.[target]?.[0];

/**
 * The Hosting sites of the Firebase project `project` that `.firebaserc` gives to a target name
 * other than `target`. Each site id is paired with the target name that has it.
 */
export const hostingSitesOfOtherTargets = (rc: FirebaseRc, project: string, target: string): Record<string, string> => {
  const otherTargetBySite: Record<string, string> = {};
  for (const [otherTarget, sites] of Object.entries(rc.targets?.[project]?.hosting ?? {})) {
    if (otherTarget === target) { continue; }
    for (const site of sites) { otherTargetBySite[site] = otherTarget; }
  }
  return otherTargetBySite;
};

/** Reads `.firebaserc` from the workspace root. A missing or unreadable file reads as empty. */
export const readFirebaseRc = (root: string): FirebaseRc => {
  try {
    return JSON.parse(readFileSync(join(root, ".firebaserc")).toString());
  } catch {
    return {};
  }
};
