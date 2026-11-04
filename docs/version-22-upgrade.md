# Upgrading to the AngularFire 22 release candidate

AngularFire 22 targets **Angular 22** and the **Firebase JS SDK v12 or v13**. Most of the upgrade is handled for you by `ng update`.

## Run the update

AngularFire 22 is a release candidate, published under the `next` tag. From an app on Angular 21 and AngularFire 21, run:

```bash
ng update @angular/core@22 @angular/cli@22 @angular/fire@next
```

Include `@angular/fire@next` in the same command as Angular. On its own, `ng update @angular/core@22 @angular/cli@22` refuses to run while AngularFire 21 is installed, because AngularFire 21 only accepts Angular 21.

The AngularFire update runs a migration that:

- **Adds** `firebase` **to your** `package.json` **if it is missing**, and reinstalls. See the next section for why.
- **Aligns an existing** `firebase` **entry** when it requests a version outside `^12.18.0 || ^13.0.0`, the range AngularFire 22 supports.

Either way, the migration writes `^13.0.0` when firebase 13 is already installed and `^12.18.0` otherwise, so an app on firebase 12 stays on 12 and an app on firebase 13 stays on 13.

## Your app now owns the Firebase SDK

Through AngularFire 21, `@angular/fire` listed `firebase` under `dependencies`, so npm could install a second copy of the SDK under `node_modules/` whenever your app asked for a different version. The two copies reject each other's objects at runtime, with errors such as `Expected type '_Query', but it was: a custom _CollectionReference object` or `toDate is not a function`.

AngularFire 22 lists `firebase` under `peerDependencies` instead. So your app should declare `firebase` in its `package.json` (on Yarn it must, since Yarn installs no peer dependencies). This gives you exactly one copy of `firebase`, and an incompatible version is refused at install time instead of failing at runtime.

`ng update @angular/fire@next` updates an older `firebase` entry in your `package.json` when it requests a version outside `^12.18.0 || ^13.0.0`. If your app doesn't list `firebase` in `package.json`, the migration adds it and reinstalls. Verify with `npm ls firebase`, which should show exactly one copy.

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

An older version installs anyway with a warning (`has incorrect peer dependency "firebase@^12.18.0 || ^13.0.0"` on Yarn 1, `YN0060: INCOMPATIBLE_PEER_DEPENDENCY` on Yarn 2+), so treat that warning as an upgrade step you still have to do.

### pnpm

pnpm 8 and later install a missing `firebase` automatically. An older version installs anyway with a warning (`unmet peer firebase@"^12.18.0 || ^13.0.0": found 11.x` on pnpm 9 and 10, `Issues with peer dependencies found. Run "pnpm peers check" to list them.` on pnpm 11 and 12), and pnpm prints that warning only once, when it first resolves the tree, never on a later install from the committed lockfile.

Set `strict-peer-dependencies=true` in `.npmrc` to make pnpm refuse the mismatch outright.

## Firebase 13 is optional

AngularFire 22 works with firebase 12 (`^12.18.0`) and firebase 13 (`^13.0.0`). `ng update` keeps the firebase major your app already has, so moving to firebase 13 is a separate step you can take when you are ready:

```bash
npm install firebase@^13.0.0
```

Before you update, check these firebase 13 changes:

- **`VertexAIBackend` is removed** from `firebase/ai`, and so from `@angular/fire/ai`. Use `AgentPlatformBackend`, which firebase 12.18 also exports, so you can switch before you upgrade.
  - `VertexAIBackend` defaults to the `us-central1` location and `AgentPlatformBackend` to `global`, so replace `new VertexAIBackend()` with `new AgentPlatformBackend('us-central1')` to keep the same location.
  - A call that already passes a location keeps it as is.
- **Node.js 24.12 or later.** firebase 13's packages declare `"node": ">=24.12.0"`, so on Node.js 22 npm prints `EBADENGINE` warnings when it installs them.

For everything else that changed, see the [Firebase JavaScript SDK release notes](https://firebase.google.com/support/release-notes/js).

## Fewer build-time packages

`@angular/fire` no longer installs `@angular-devkit/schematics`, `@angular-devkit/core` or `@schematics/angular`. The Angular CLI supplies them when it runs `ng add` and `ng update`, so nothing changes for an Angular CLI or Nx workspace.

If you run AngularFire's schematics with the standalone `schematics` command on pnpm with `hoist=false`, add those three packages to your own `package.json`.

## Deploy builder

Deploying server-side rendering to Cloud Functions with `ng deploy` (a deploy target with `ssr: true` or `ssr: 'cloud-functions'`, and the `functionsRuntimeOptions` and `CF3v2` options only it reads) is deprecated in AngularFire 22 and will be removed in AngularFire 23. `ng deploy` prints a warning before the build when it runs in that mode. Server-rendered apps should move to [Firebase App Hosting](./app-hosting.md).

Hosting-only deploys (`ssr` absent or `false`) and Cloud Run deploys (`ssr: 'cloud-run'`) are not deprecated. They no longer print the old "Legacy ng-deploy Firebase is deprecated" message.

## Observable reads deliver as microtasks

Every Observable read (`collectionData`, `docData`, `authState`, `user`, `objectVal`, `listVal` and the rest) used to hand each value to your subscriber on a timer (`setInterval` with no delay), one event-loop turn later. It now does so at the next microtask checkpoint, which is sooner. The compat `AngularFireAuth` streams change the same way. What arrives, in which order, and when change detection runs do not change.

What an upgrading app may notice:

- A test that waits only for microtasks (a few awaited promises, vitest fake timers without advancing, `fakeAsync` with `flushMicrotasks()` alone) now sees a value whose source emits in a microtask, as Auth and a promise-based mock do.
  - In a test that fakes timers, a Firestore value still arrives only after the clock is advanced with `tick()` or `vi.advanceTimersByTime()`, because the Firestore SDK hands each snapshot over inside a `setTimeout`.
  - A test that already advances the clock, or waits for a real timer, sees the value exactly as before.
- Code that registers its own `setTimeout` when a read emits sees that timer run after the value arrives, not before.
- In a zoneless server render, a value arriving between the app reporting stable and serialization now reaches a `TransferState` entry you write by hand but not the HTML, because the zoneless change-detection pass is itself a later timer.
  - Before this change such a value reached neither. AngularFire itself writes nothing into `TransferState`.

## Other notes

- **Node.js 20 is not supported.** Angular 22 requires Node.js `^22.22.3 || ^24.15.0 || >=26.0.0`. Node.js 20 reached end of life on 2026-04-30.
- **TypeScript 6.0 is required** (AngularFire 22 peers `typescript >=6.0 <6.1`). TypeScript 6 turns `strict` on by default, drops `downlevelIteration` and deprecates `baseUrl` and `moduleResolution: "node"`, so an app carrying those settings in its `tsconfig.json` may see new compiler errors that Angular's own update does not fix.
- **Coming from a 21 release candidate** (`21.0.0-rc.0`, `rc.1` or `rc.2`), the v21 migration runs once more and reports "No changes made", because `21.0.0` lies between your version and `22.0.0`. That is expected.
- **Coming from a 22 canary build.** On `22.0.0-canary.*`, run `ng update @angular/fire@next`. On `22.0.1-canary.*`, run `ng update @angular/fire@canary`.
- **Screen tracking** (`ScreenTrackingService`) reads the routed component's selector through Angular's `reflectComponentType`, because `ComponentFactoryResolver` is gone from Angular 22. Nothing changes for your app.
