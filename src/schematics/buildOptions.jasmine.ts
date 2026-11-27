import {
  BuildTargetDefinition,
  browserOutputDirectory,
  clientSidePage,
  productionBuildOptions,
  rendersOnServer,
} from './buildOptions.js';
import 'jasmine';

const applicationBuilder = '@angular/build:application';

describe('productionBuildOptions', () => {

  it('overlays the production configuration on the build options', () => {
    const buildTarget: BuildTargetDefinition = {
      builder: applicationBuilder,
      options: { outputPath: 'dist/app', index: 'src/index.html' },
      configurations: { production: { outputPath: 'dist/production' } },
    };
    expect(productionBuildOptions(buildTarget)).toEqual({
      outputPath: 'dist/production',
      index: 'src/index.html',
    });
  });

  it('is empty for a project with no build entry', () => {
    expect(productionBuildOptions(undefined)).toEqual({});
  });

});

describe('rendersOnServer', () => {

  it('is true for the server output mode', () => {
    expect(rendersOnServer({ outputMode: 'server', server: 'src/main.server.ts' })).toBeTrue();
  });

  it('is false for the static output mode, which prerenders every route', () => {
    const options = { outputMode: 'static', server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' } };
    expect(rendersOnServer(options)).toBeFalse();
  });

  it('is true without an output mode when the build has ssr and a server entry', () => {
    expect(rendersOnServer({ server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' } })).toBeTrue();
  });

  it('is false without an output mode for a build that only prerenders', () => {
    expect(rendersOnServer({ server: 'src/main.server.ts', prerender: true })).toBeFalse();
  });

  it('is false for a client-rendered build', () => {
    expect(rendersOnServer({ browser: 'src/main.ts' })).toBeFalse();
  });

});

describe('clientSidePage', () => {

  it('is index.html for a client-rendered build', () => {
    expect(clientSidePage({ browser: 'src/main.ts' })).toBe('index.html');
  });

  it('is index.csr.html for the server output mode', () => {
    expect(clientSidePage({ outputMode: 'server', server: 'src/main.server.ts' })).toBe('index.csr.html');
  });

  it('is index.csr.html for the static output mode', () => {
    expect(clientSidePage({ outputMode: 'static', server: 'src/main.server.ts' })).toBe('index.csr.html');
  });

  it('is index.csr.html without an output mode when the build has ssr', () => {
    expect(clientSidePage({ server: 'src/main.server.ts', ssr: true })).toBe('index.csr.html');
  });

  it('is index.csr.html without an output mode when the build prerenders', () => {
    expect(clientSidePage({ server: 'src/main.server.ts', prerender: true })).toBe('index.csr.html');
  });

  it('keeps the file name of a custom index source file, on a server-rendered build too', () => {
    const options = { outputMode: 'server', server: 'src/main.server.ts', index: 'src/main.html' };
    expect(clientSidePage(options)).toBe('main.html');
  });

  it('uses the output name of an index option written as an object', () => {
    const options = { index: { input: 'src/index.html', output: 'home.html' } };
    expect(clientSidePage(options)).toBe('home.html');
  });

});

describe('browserOutputDirectory', () => {

  it('is dist/<project>/browser for the application builder with no output path', () => {
    expect(browserOutputDirectory('my-app', { builder: applicationBuilder })).toBe('dist/my-app/browser');
  });

  it('treats the application builder of @angular-devkit/build-angular the same way', () => {
    const buildTarget: BuildTargetDefinition = { builder: '@angular-devkit/build-angular:application' };
    expect(browserOutputDirectory('my-app', buildTarget)).toBe('dist/my-app/browser');
  });

  it('adds the browser folder to an output path written as text', () => {
    const buildTarget: BuildTargetDefinition = { builder: applicationBuilder, options: { outputPath: 'build/' } };
    expect(browserOutputDirectory('my-app', buildTarget)).toBe('build/browser');
  });

  it('joins the base and browser folders of an output path written as an object', () => {
    const buildTarget: BuildTargetDefinition = {
      builder: applicationBuilder,
      options: { outputPath: { base: 'build', browser: 'public' } },
    };
    expect(browserOutputDirectory('my-app', buildTarget)).toBe('build/public');
  });

  it('adds the browser folder to an output path object that has only a base folder', () => {
    const buildTarget: BuildTargetDefinition = { builder: applicationBuilder, options: { outputPath: { base: 'build' } } };
    expect(browserOutputDirectory('my-app', buildTarget)).toBe('build/browser');
  });

  it('is the base folder when the browser folder is set to an empty name', () => {
    const buildTarget: BuildTargetDefinition = {
      builder: applicationBuilder,
      options: { outputPath: { base: 'build', browser: '' } },
    };
    expect(browserOutputDirectory('my-app', buildTarget)).toBe('build');
  });

  it('uses the output path of the production configuration', () => {
    const buildTarget: BuildTargetDefinition = {
      builder: applicationBuilder,
      options: { outputPath: 'build' },
      configurations: { production: { outputPath: 'release' } },
    };
    expect(browserOutputDirectory('my-app', buildTarget)).toBe('release/browser');
  });

  it('is the output path itself for the older browser builder', () => {
    const buildTarget: BuildTargetDefinition = {
      builder: '@angular-devkit/build-angular:browser',
      options: { outputPath: 'www' },
    };
    expect(browserOutputDirectory('my-app', buildTarget)).toBe('www');
  });

});
