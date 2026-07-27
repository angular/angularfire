import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { stringifyFormatted } from '../common.js';
import { FEATURES, FirebaseJSON, FirebaseRc } from '../interfaces.js';

/**
 * Builds the same test-mode starter rules `firebase init firestore` generates: anyone can read
 * and write until a date 30 days from generation, after which all client requests are denied.
 */
const testModeFirestoreRules = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  return `rules_version='2'

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // This rule allows anyone with your database reference to view, edit,
      // and delete all data in your database. It is useful for getting
      // started, but it is configured to expire after 30 days because it
      // leaves your app open to attackers. At that time, all client
      // requests to your database will be denied.
      //
      // Make sure to write security rules for your app before that time, or
      // else all client requests to your database will be denied until you
      // update your rules.
      allow read, write: if request.time < timestamp.date(${expiry.getFullYear()}, ${expiry.getMonth() + 1}, ${expiry.getDate()});
    }
  }
}
`;
};

/**
 * Records the selected Firebase project as the workspace's default in `.firebaserc`, so
 * firebase-tools commands the user runs after setup completes don't prompt for (or fail without)
 * a project. Merges into an existing file — only `projects.default` is set; targets and other
 * aliases are preserved. Written to the real filesystem (not the schematic Tree) because
 * `firebaseTools.init` writes `.firebaserc` on disk during the same `ng add` run — a Tree-staged
 * copy would collide with it when the schematic commits; call this after the last
 * `firebaseTools.init` call for that reason.
 */
export const setDefaultProjectInFirebaseRc = (projectRoot: string, projectId: string) => {
  const path = join(projectRoot, '.firebaserc');
  let rc: FirebaseRc = {};
  if (existsSync(path)) {
    try {
      rc = JSON.parse(readFileSync(path).toString());
    } catch (e) {
      throw new SchematicsException(`Error when parsing ${path}: ${e.message}`);
    }
  }
  rc.projects = { ...rc.projects, default: projectId };
  writeFileSync(path, stringifyFormatted(rc));
};

/**
 * When Firestore is selected, generates `firestore.rules` (test mode, with a logged warning
 * about the 30-day expiry) and `firestore.indexes.json`. Existing files are never overwritten —
 * a later `firebase deploy` would replace rules already deployed from elsewhere. A workspace
 * whose firebase.json already has a `firestore` section is left entirely untouched: its section
 * may point at differently-named files, and creating the default-named ones would only add
 * orphans nothing references.
 *
 * `firebaseJsonConfig`, when passed, should be the post-init snapshot of firebase.json (read
 * after the last `firebaseTools.init` call and before `addFirestoreToFirebaseJson` runs) — see
 * the call site in `ngAddSetupProject` for why that order matters. Passing a stale pre-init
 * snapshot risks staging the default-named starter files on top of files firebase-tools already
 * wrote to disk, colliding when the Tree commits.
 */
export const createFirestoreStarterFiles = (
  host: Tree,
  context: SchematicContext,
  features: FEATURES[],
  firebaseJsonConfig?: FirebaseJSON,
) => {
  if (!features.includes(FEATURES.Firestore)) { return; }
  if (firebaseJsonConfig?.firestore) {
    context.logger.info('firebase.json already has a firestore section — leaving its rules and indexes untouched.');
    return;
  }
  if (host.exists('/firestore.rules')) {
    context.logger.info('firestore.rules already exists — leaving it untouched.');
  } else {
    host.create('/firestore.rules', testModeFirestoreRules());
    context.logger.warn(
      'Generated firestore.rules in test mode: anyone can read and write your database until the rules expire in 30 days. ' +
      'Write real security rules before then — https://firebase.google.com/docs/rules'
    );
  }
  if (!host.exists('/firestore.indexes.json')) {
    // Must exist once firebase.json references it — `firebase deploy` errors on a missing indexes file.
    host.create('/firestore.indexes.json', stringifyFormatted({ indexes: [], fieldOverrides: [] }));
  }
};

/**
 * When Firestore is selected, points the `firestore` section of `firebase.json` at the starter
 * files so `firebase deploy` includes rules and indexes. Written to the real filesystem (not the
 * schematic Tree) because firebase-tools reads and rewrites `firebase.json` during the same
 * `ng add` run; call this after the last `firebaseTools.init` call for that reason.
 */
export const addFirestoreToFirebaseJson = (
  projectRoot: string,
  context: SchematicContext,
  features: FEATURES[],
) => {
  if (!features.includes(FEATURES.Firestore)) { return; }
  // firebaseTools.init calls may have rewritten firebase.json on disk, so re-read it, add the
  // firestore section if absent, and write it back. The whole read-check-write is guarded: a
  // failed read (missing or unparseable file), a parse that isn't a usable object (reading
  // `.firestore` off `null`/`undefined` throws; assigning it on a non-object primitive throws
  // too), or a failed write (disk full, permissions) all warn and leave the file for the user to
  // finish, rather than crashing the schematic with a raw Node error.
  try {
    const firebaseJson: FirebaseJSON = JSON.parse(readFileSync(join(projectRoot, 'firebase.json')).toString());
    if (!firebaseJson.firestore) {
      firebaseJson.firestore = { rules: 'firestore.rules', indexes: 'firestore.indexes.json' };
      writeFileSync(join(projectRoot, 'firebase.json'), stringifyFormatted(firebaseJson));
    }
  } catch (e) {
    context.logger.warn(
      `Could not update firebase.json with the firestore section (${e.message}). Check firebase.json ` +
      'and add { "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" } } manually.'
    );
  }
};
