# Upgrading to the AngularFire 22 canary

AngularFire 22 targets **Angular 22** and the **Firebase JS SDK v12**. Most of the upgrade is handled for you by `ng update`.

## Run the update

AngularFire 22 is published under the `canary` tag, a build of every merge to `main`, until a release candidate is published under `next`. From an app on Angular 21 and AngularFire 21, run:

```bash
ng update @angular/core@22 @angular/cli@22 @angular/fire@canary
```

Include `@angular/fire@canary` in the same command as Angular. On its own, `ng update @angular/core@22 @angular/cli@22` refuses to run while AngularFire 21 is installed, because AngularFire 21 only accepts Angular 21.

The AngularFire update runs a migration that:

- **Adds** `firebase` **to your** `package.json` **if it is missing**, as `"firebase": "^12.18.0"`, and reinstalls. See the next section for why.
- **Aligns an existing** `firebase` **entry to** `^12.18.0` when it requests a version outside that range.

## Your app now owns the Firebase SDK

Through AngularFire 21, `@angular/fire` listed `firebase` under `dependencies`, so npm could install a second copy of the SDK under `node_modules/` whenever your app asked for a different version. The two copies reject each other's objects at runtime, with errors such as `Expected type '_Query', but it was: a custom _CollectionReference object` or `toDate is not a function`.

AngularFire 22 lists `firebase` under `peerDependencies` instead. So your app should declare `firebase` in its `package.json` (on Yarn it must, since Yarn installs no peer dependencies). This gives you exactly one copy of `firebase`, and an incompatible version is refused at install time instead of failing at runtime.

`ng update @angular/fire@canary` updates an older `firebase` entry in your `package.json` to the current 12.x release. If your app doesn't list `firebase` in `package.json` the migration adds `"firebase": "^12.18.0"` and reinstalls. Verify with `npm ls firebase`, which should show exactly one copy.

### If you install with `npm install` instead of `ng update`

Add the dependency yourself:

```bash
npm install @angular/fire@canary firebase@^12.18.0
```

npm 7 and later install a missing peer dependency automatically, so `npm install @angular/fire@canary` alone also works, but it does not write `firebase` into your `package.json`. Declare it so that a later install cannot change which version you get.

### If npm stops with `ERESOLVE`

An app that requests a `firebase` version outside the range AngularFire 22 supports now fails to install with an `ERESOLVE` error. Update your `firebase` entry to a version inside the range given in the error message, then install again:

```bash
npm install firebase@^12.18.0
```

Do not use `--force` or `--legacy-peer-deps` to get past this message. Both install the older SDK next to AngularFire 22 and the runtime errors described above come back. If your project has `legacy-peer-deps=true` in its `.npmrc`, remove it before upgrading.

### Yarn

Yarn doesn't install peer dependencies. Add `firebase` to your own `package.json` as shown above, or run `ng update @angular/fire@canary`, which adds it.

An older version installs anyway with a warning (`has incorrect peer dependency "firebase@^12.18.0"` on Yarn 1, `YN0060: INCOMPATIBLE_PEER_DEPENDENCY` on Yarn 2+), so treat that warning as an upgrade step you still have to do.

### pnpm

pnpm 8 and later install a missing `firebase` automatically. An older version installs anyway with `unmet peer firebase@^12.18.0: found 11.x`, and pnpm prints that warning only once, when it first resolves the tree, never on a later install from the committed lockfile.

Set `strict-peer-dependencies=true` in `.npmrc` to make pnpm refuse the mismatch outright.
