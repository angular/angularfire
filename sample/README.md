# AngularFire 21 Sample App

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.0.

## AngularFire tarball

The sample consumes the library as `file:../angular-fire-21.0.0-rc.1.tgz`. Produce that file from the repository root before installing here:

```bash
npm ci
npm run build
```

The root build ends with `npm pack ./dist/packages-dist`, which writes `angular-fire-<version>.tgz` next to this folder. When the root package version changes, update the `file:` path in `package.json` and the install command below to match.

Then, from this `sample/` folder, install the dependencies by naming the tarball explicitly:

```bash
npm install ../angular-fire-21.0.0-rc.1.tgz
```

A plain `npm install` is not reliable here. `package-lock.json` records the integrity hash of the tarball built by whoever committed the lockfile, and a tarball you build yourself can hash differently. With a cold npm cache the install then fails with an `EINTEGRITY` error. With a warm cache that holds the recorded hash, npm installs the stale cached copy and exits successfully, so you would be testing a library you did not build. Naming the tarball installs the file on disk and rewrites the recorded hash in your local `package-lock.json`. Leave that lockfile change uncommitted.

## Cloud Functions demo

The Functions demo calls a Cloud Function whose source lives in `functions/`. It is its own small project, so install and build it once before starting the emulators, or the functions emulator will skip it with a warning:

```bash
cd functions
npm install
npm run build
```

## Development server

Every demo in the sample talks to the local Firebase emulators, so start the emulator suite and the dev server together:

```bash
npm start
```

This boots the emulators with seeded data and then runs `ng serve`. Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files. A bare `ng serve` also works, but the demos will have no backend to talk to.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with [Vitest](https://vitest.dev), use the following command:

```bash
ng test
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
