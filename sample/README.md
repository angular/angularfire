# Ng21Test

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.0.

## AngularFire tarball

The sample consumes the library as `file:../angular-fire-21.0.0-rc.0.tgz`. Produce that file from the repository root before installing here:

```bash
npm ci
npm run build
```

The root build ends with `npm pack ./dist/packages-dist`, which writes `angular-fire-<version>.tgz` next to this folder. When the root package version changes, update the `file:` path in `package.json` to match.

## Cloud Functions demo

The Functions demo calls a Cloud Function whose source lives in `functions/`. It is its own small project, so install and build it once before starting the emulators, or the functions emulator will skip it with a warning:

```bash
cd functions
npm install
npm run build
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

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

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
