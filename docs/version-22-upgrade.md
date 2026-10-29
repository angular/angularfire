# Upgrading to the AngularFire 22 release candidate

AngularFire 22 targets **Angular 22** and the **Firebase JS SDK v12**. Most of the upgrade is handled for you by `ng update`.

## Run the update

AngularFire 22 is a release candidate, published under the `next` tag. From an app on Angular 21 and AngularFire 21, run:

```bash
ng update @angular/core@22 @angular/cli@22 @angular/fire@next
```

Include `@angular/fire@next` in the same command as Angular. On its own, `ng update @angular/core@22 @angular/cli@22` refuses to run while AngularFire 21 is installed, because AngularFire 21 only accepts Angular 21.

The AngularFire update runs a migration that:

- **Adds** `firebase` **to your** `package.json` **if it is missing**, as `"firebase": "^12.18.0"`, and reinstalls. See the next section for why.
- **Aligns an existing** `firebase` **entry to** `^12.18.0` when it requests a version outside that range.

## Your app now owns the Firebase SDK

Through AngularFire 21, `@angular/fire` listed `firebase` under `dependencies`, so npm could install a second copy of the SDK under `node_modules/` whenever your app asked for a different version. The two copies reject each other's objects at runtime, with errors such as `Expected type '_Query', but it was: a custom _CollectionReference object` or `toDate is not a function`.

AngularFire 22 lists `firebase` under `peerDependencies` instead. So your app should declare `firebase` in its `package.json` (on Yarn it must, since Yarn installs no peer dependencies). This gives you exactly one copy of `firebase`, and an incompatible version is refused at install time instead of failing at runtime.

`ng update @angular/fire@next` updates an older `firebase` entry in your `package.json` to `^12.18.0` when it requests a version outside that range. If your app doesn't list `firebase` in `package.json` the migration adds `"firebase": "^12.18.0"` and reinstalls. Verify with `npm ls firebase`, which should show exactly one copy.

### If you install with `npm install` instead of `ng update`

Add the dependency yourself:

```bash
npm install @angular/fire@next firebase@^12.18.0
```

npm 7 and later install a missing peer dependency automatically, so `npm install @angular/fire@next` alone also works, but it does not write `firebase` into your `package.json`. Declare it so that a later install cannot change which version you get.

### If npm stops with `ERESOLVE`

An app that requests a `firebase` version outside the range AngularFire 22 supports now fails to install with an `ERESOLVE` error. Update your `firebase` entry to a version inside the range given in the error message, then install again:

```bash
npm install firebase@^12.18.0
```

Do not use `--force` or `--legacy-peer-deps` to get past this message. Both install the older SDK next to AngularFire 22 and the runtime errors described above come back. If your project has `legacy-peer-deps=true` in its `.npmrc`, remove it before upgrading.

### Yarn

Yarn doesn't install peer dependencies. Add `firebase` to your own `package.json` as shown above, or run `ng update @angular/fire@next`, which adds it.

An older version installs anyway with a warning (`has incorrect peer dependency "firebase@^12.18.0"` on Yarn 1, `YN0060: INCOMPATIBLE_PEER_DEPENDENCY` on Yarn 2+), so treat that warning as an upgrade step you still have to do.

### pnpm

pnpm 8 and later install a missing `firebase` automatically. An older version installs anyway with a warning (`unmet peer firebase@^12.18.0: found 11.x` on pnpm 9 and 10, `Issues with peer dependencies found. Run "pnpm peers check" to list them.` on pnpm 11 and 12), and pnpm prints that warning only once, when it first resolves the tree, never on a later install from the committed lockfile.

Set `strict-peer-dependencies=true` in `.npmrc` to make pnpm refuse the mismatch outright.

## Fewer build-time packages

`@angular/fire` no longer installs `@angular-devkit/schematics`, `@angular-devkit/core` or `@schematics/angular`. The Angular CLI supplies them when it runs `ng add` and `ng update`, so nothing changes for an Angular CLI or Nx workspace.

If you run AngularFire's schematics with the standalone `schematics` command on pnpm with `hoist=false`, add those three packages to your own `package.json`.

## Deploy builder

Deploying server-side rendering to Cloud Functions with `ng deploy` (a deploy target with `ssr: true` or `ssr: 'cloud-functions'`, and the `functionsRuntimeOptions` and `CF3v2` options only it reads) is deprecated in AngularFire 22 and will be removed in AngularFire 23. `ng deploy` prints a warning before the build when it runs in that mode. Server-rendered apps should move to [Firebase App Hosting](./app-hosting.md).

Hosting-only deploys (`ssr` absent or `false`) and Cloud Run deploys (`ssr: 'cloud-run'`) are not deprecated. They no longer print the old "Legacy ng-deploy Firebase is deprecated" message.

## Other notes

- **Node.js 20 is not supported.** Angular 22 requires Node.js `^22.22.3 || ^24.15.0 || >=26.0.0`. Node.js 20 reached end of life on 2026-04-30.
- **TypeScript 6.0 is required** (AngularFire 22 peers `typescript >=6.0 <6.1`). TypeScript 6 turns `strict` on by default, drops `downlevelIteration` and deprecates `baseUrl` and `moduleResolution: "node"`, so an app carrying those settings in its `tsconfig.json` may see new compiler errors that Angular's own update does not fix.
- **Coming from a 21 release candidate** (`21.0.0-rc.0`, `rc.1` or `rc.2`), the v21 migration runs once more and reports "No changes made", because `21.0.0` lies between your version and `22.0.0`. That is expected.
- **Coming from a 22 canary build.** On `22.0.0-canary.*`, run `ng update @angular/fire@next`. On `22.0.1-canary.*`, run `ng update @angular/fire@canary`.
- **Screen tracking** (`ScreenTrackingService`) reads the routed component's selector through Angular's `reflectComponentType`, because `ComponentFactoryResolver` is gone from Angular 22. Nothing changes for your app.
