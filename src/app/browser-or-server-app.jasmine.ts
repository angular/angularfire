import { EnvironmentInjector, PLATFORM_ID, Provider, REQUEST, REQUEST_CONTEXT, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BrowserOrServerAppSettings,
  FirebaseApp,
  initializeBrowserOrServerApp,
  provideFirebaseApp,
  ɵresetBrowserOrServerAppWarnings,
} from '@angular/fire/app';
import { FirebaseOptions, FirebaseServerApp, FirebaseServerAppSettings, deleteApp, getApp, initializeApp, initializeServerApp } from 'firebase/app';

/** One options object for the whole file: a second default app with other options would throw
 * app/duplicate-app for the rest of the process. */
const SPEC_OPTIONS = { apiKey: 'spec-api-key', projectId: 'spec-project', appId: '1:1:web:spec' };

/** Encodes a value as the base64url JSON a JWT segment holds. */
const base64url = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString('base64url');

/**
 * Builds a token shaped like a JWT, `header.payload.signature`. The SDK reads only the payload, so
 * any header and signature do. The payload expires in an hour unless `claims` says otherwise, and
 * carries a fresh random `jti` so every token, and so every server app, is distinct from the other
 * specs'.
 */
const buildToken = (claims: Record<string, unknown>): string => {
  const header = base64url({ alg: 'none' });
  const oneHourAhead = Math.floor(Date.now() / 1000) + 3600;
  const payload = base64url({ exp: oneHourAhead, jti: Math.random(), ...claims });
  const signature = 'sig';
  return [header, payload, signature].join('.');
};

/**
 * Configures a TestBed whose Firebase app comes from `initializeBrowserOrServerApp`, alongside the
 * given providers (typically `REQUEST_CONTEXT` and `REQUEST`), and returns the injected app.
 */
const configure = (providers: Provider[], settings?: BrowserOrServerAppSettings, options: FirebaseOptions = SPEC_OPTIONS): FirebaseApp => {
  TestBed.configureTestingModule({
    providers: [...providers, provideFirebaseApp(() => initializeBrowserOrServerApp(options, settings))],
  });
  return TestBed.inject(FirebaseApp);
};

/** A token whose payload decodes to "not json", which JSON.parse rejects, so the SDK's token check throws a SyntaxError. */
const UNPARSEABLE_PAYLOAD = Buffer.from('not json').toString('base64url');
const UNPARSEABLE_TOKEN = `h.${UNPARSEABLE_PAYLOAD}.s`;

/** Everything a `console.warn` spy was called with, joined into one string for `toContain` checks. */
const warningText = (warn: jasmine.Spy): string => warn.calls.allArgs().flat().join(' ');

/** Only a FirebaseServerApp has `settings`, which is the public way to tell the two kinds of app apart. */
const isServerApp = (app: FirebaseApp): app is FirebaseServerApp => 'settings' in app;

/** Narrows to FirebaseServerApp, failing the spec when the app is the ordinary one. */
const serverAppOrFail = (app: FirebaseApp): FirebaseServerApp => {
  if (!isServerApp(app)) {
    throw new Error('expected a server app');
  }
  return app;
};

const wait = (milliseconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds));

/** Reading `settings` on a deleted server app throws `app/server-app-deleted`, the public sign of a release. */
const isDeleted = (app: FirebaseServerApp): boolean => {
  try { return app.settings === undefined }
  catch { return true }
};

/** The SDK marks a server app deleted only after its providers have torn down, so the wait is bounded, not fixed. */
const untilDeleted = async (app: FirebaseServerApp): Promise<void> => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (isDeleted(app)) { return; }
    await wait(10);
  }
  throw new Error('the server app was not deleted within a second');
};

/**
 * Spies on every FinalizationRegistry registration in the process. The SDK registers the object it
 * is handed as `releaseOnDeref`, so the spy shows whether, and with what, the function asked for a
 * release at garbage collection.
 */
const spyOnRegistry = () => spyOn(FinalizationRegistry.prototype, 'register').and.callThrough();

/**
 * The objects registered for one app's release, from a process-wide spy that any other
 * registration in the process would also reach. The SDK registers each `releaseOnDeref` object
 * with the app as the held value.
 */
const registrationsFor = (register: jasmine.Spy, app: FirebaseApp): unknown[] =>
  register.calls.allArgs().filter(([, heldValue]) => heldValue === app).map(([holder]) => holder);

describe('initializeBrowserOrServerApp', () => {
  beforeEach(() => ɵresetBrowserOrServerAppWarnings());
  afterEach(() => TestBed.resetTestingModule());

  it('returns the default app on the server with no request context and no settings', () => {
    const app = configure([]);
    expect(TestBed.inject(PLATFORM_ID)).toBe('server');
    expect(isServerApp(app)).toBeFalse();
    expect(app).toBe(getApp());
    TestBed.resetTestingModule();
    expect(configure([])).toBe(app);
  });

  it('returns a default app the application created itself, without throwing app/duplicate-app', () => {
    const existing = initializeApp(SPEC_OPTIONS);
    let app: FirebaseApp | undefined;
    expect(() => { app = configure([]); }).not.toThrow();
    expect(app).toBe(existing);
  });

  it('builds a server app from the authIdToken in the request context', () => {
    const authIdToken = buildToken({});
    const app = serverAppOrFail(configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken } }]));
    expect(app.settings.authIdToken).toBe(authIdToken);
  });

  it('ignores a request context that is not an object or whose token is not a string', () => {
    expect(isServerApp(configure([{ provide: REQUEST_CONTEXT, useValue: 'oops' }]))).toBeFalse();
    TestBed.resetTestingModule();
    expect(isServerApp(configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken: 123 } }]))).toBeFalse();
  });

  it('prefers an explicit authIdToken over the request context', () => {
    const explicit = buildToken({ source: 'settings' });
    const fromRequest = buildToken({ source: 'request' });
    const app = serverAppOrFail(configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken: fromRequest } }], { authIdToken: explicit }));
    expect(app.settings.authIdToken).toBe(explicit);
  });

  it('falls through to the request context when the explicit authIdToken is empty', () => {
    const fromRequest = buildToken({});
    const app = serverAppOrFail(configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken: fromRequest } }], { authIdToken: '' }));
    expect(app.settings.authIdToken).toBe(fromRequest);
  });

  it('returns the default app when the request context holds an empty authIdToken', () => {
    const app = configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken: '' } }]);
    expect(isServerApp(app)).toBeFalse();
    expect(app).toBe(getApp());
  });

  it('builds a server app from an explicit appCheckToken with no request context', () => {
    const appCheckToken = buildToken({ kind: 'appCheck' });
    const app = serverAppOrFail(configure([], { appCheckToken }));
    expect(app.settings.appCheckToken).toBe(appCheckToken);
    expect(app.settings.authIdToken).toBeUndefined();
  });

  it('forwards automaticDataCollectionEnabled to the server app', () => {
    const app = serverAppOrFail(configure([], { appCheckToken: buildToken({}), automaticDataCollectionEnabled: false }));
    expect(app.settings.automaticDataCollectionEnabled).toBeFalse();
  });

  describe('releasing the server app', () => {
    it('by default hands the SDK its own object to release the app at garbage collection', async () => {
      const register = spyOnRegistry();
      const context = { authIdToken: buildToken({}) };
      const settings: BrowserOrServerAppSettings = {};
      const app = serverAppOrFail(configure([{ provide: REQUEST_CONTEXT, useValue: context }], settings));
      const holders = registrationsFor(register, app);
      expect(holders.length).toBe(1);
      expect(typeof holders[0]).toBe('object');
      expect(holders[0]).not.toBe(context);
      expect(holders[0]).not.toBe(settings);
      TestBed.resetTestingModule();
      await wait(50);
      expect(isDeleted(app)).toBeFalse();
    });

    it('releases the app when the render ends with releaseAfterRender 0', async () => {
      const register = spyOnRegistry();
      const app = serverAppOrFail(configure([], { authIdToken: buildToken({}), releaseAfterRender: 0 }));
      expect(register).not.toHaveBeenCalled();
      TestBed.resetTestingModule();
      await untilDeleted(app);
    });

    it('releases the app that many milliseconds after the render with a positive releaseAfterRender', async () => {
      const app = serverAppOrFail(configure([], { authIdToken: buildToken({}), releaseAfterRender: 200 }));
      TestBed.resetTestingModule();
      await wait(50);
      expect(isDeleted(app)).toBeFalse();
      await untilDeleted(app);
    });

    it('caps a releaseAfterRender too long for a timer instead of releasing at once', async () => {
      const emitWarning = spyOn(process, 'emitWarning');
      const app = serverAppOrFail(configure([], { authIdToken: buildToken({}), releaseAfterRender: Infinity }));
      TestBed.resetTestingModule();
      await wait(50);
      expect(isDeleted(app)).toBeFalse();
      expect(emitWarning).not.toHaveBeenCalled();
      await deleteApp(app);
    });

    it('releases at render end when the runtime has no FinalizationRegistry', async () => {
      const registry = Reflect.get(globalThis, 'FinalizationRegistry');
      Reflect.deleteProperty(globalThis, 'FinalizationRegistry');
      try {
        const app = serverAppOrFail(configure([], { authIdToken: buildToken({}) }));
        TestBed.resetTestingModule();
        await untilDeleted(app);
      } finally {
        Reflect.set(globalThis, 'FinalizationRegistry', registry);
      }
    });

    it('shares one app between two renders with the same token and releases it after the last', async () => {
      const authIdToken = buildToken({});
      const providers = [provideFirebaseApp(() => initializeBrowserOrServerApp(SPEC_OPTIONS, { authIdToken, releaseAfterRender: 0 }))];
      const parent = TestBed.inject(EnvironmentInjector);
      const first = createEnvironmentInjector(providers, parent);
      const second = createEnvironmentInjector(providers, parent);
      const app = serverAppOrFail(first.get(FirebaseApp));
      expect(second.get(FirebaseApp)).toBe(app);
      first.destroy();
      await wait(50);
      expect(isDeleted(app)).toBeFalse();
      second.destroy();
      await untilDeleted(app);
    });

    it('registers one release object per render in the default mode', () => {
      const register = spyOnRegistry();
      const authIdToken = buildToken({});
      const providers = [provideFirebaseApp(() => initializeBrowserOrServerApp(SPEC_OPTIONS, { authIdToken }))];
      const parent = TestBed.inject(EnvironmentInjector);
      const first = createEnvironmentInjector(providers, parent);
      const second = createEnvironmentInjector(providers, parent);
      const app = first.get(FirebaseApp);
      expect(second.get(FirebaseApp)).toBe(app);
      const holders = registrationsFor(register, app);
      expect(holders.length).toBe(2);
      expect(holders[0]).not.toBe(holders[1]);
      first.destroy();
      second.destroy();
    });

    it('never hands the SDK a releaseOnDeref the type could not see', () => {
      const register = spyOnRegistry();
      const callerObject = {};
      const loose = JSON.parse(JSON.stringify({ authIdToken: buildToken({}) }));
      loose.releaseOnDeref = callerObject;
      const app = configure([], loose);
      expect(isServerApp(app)).toBeTrue();
      const holders = registrationsFor(register, app);
      expect(holders.length).toBe(1);
      expect(holders[0]).not.toBe(callerObject);
    });

    it('never hands the SDK a releaseOnDeref in the timed mode either', () => {
      const register = spyOnRegistry();
      const loose = JSON.parse(JSON.stringify({ authIdToken: buildToken({}), releaseAfterRender: 0 }));
      loose.releaseOnDeref = {};
      expect(isServerApp(configure([], loose))).toBeTrue();
      expect(register).not.toHaveBeenCalled();
    });

    it('rejects releaseOnDeref in the type', () => {
      const typed: FirebaseServerAppSettings = { authIdToken: 'h.e.s', releaseOnDeref: {} };
      // @ts-expect-error releaseOnDeref is not part of BrowserOrServerAppSettings
      const literal = () => initializeBrowserOrServerApp(SPEC_OPTIONS, { authIdToken: 'h.e.s', releaseOnDeref: {} });
      // @ts-expect-error a FirebaseServerAppSettings variable is not accepted either
      const variable = () => initializeBrowserOrServerApp(SPEC_OPTIONS, typed);
      expect(typeof literal).toBe('function');
      expect(typeof variable).toBe('function');
    });
  });

  describe('tokens the SDK rejects', () => {
    it('renders signed out with one fixed warning when a token cannot be parsed', () => {
      const warn = spyOn(console, 'warn');
      const app = configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken: UNPARSEABLE_TOKEN } }]);
      expect(isServerApp(app)).toBeFalse();
      expect(app).toBe(getApp());
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warningText(warn)).toContain('could not be parsed');
      expect(warningText(warn)).not.toContain(UNPARSEABLE_PAYLOAD);
      expect(warningText(warn)).not.toContain('not json');
      TestBed.resetTestingModule();
      expect(configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken: UNPARSEABLE_TOKEN } }])).toBe(getApp());
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('leaves a junk token to the SDK and still releases the app it builds', async () => {
      spyOn(console, 'error');
      const warn = spyOn(console, 'warn');
      const app = serverAppOrFail(configure([], { authIdToken: 'garbagegarbage', releaseAfterRender: 0 }));
      expect(warn).not.toHaveBeenCalled();
      TestBed.resetTestingModule();
      await untilDeleted(app);
    });

    it('renders signed out when a valid ID token comes with an unparseable App Check token', () => {
      const warn = spyOn(console, 'warn');
      const app = configure([], { authIdToken: buildToken({}), appCheckToken: UNPARSEABLE_TOKEN });
      expect(isServerApp(app)).toBeFalse();
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('lets a FirebaseError from initializeServerApp propagate', () => {
      const warn = spyOn(console, 'warn');
      Reflect.set(globalThis, 'window', {});
      try {
        expect(() => configure([], { authIdToken: buildToken({}) }))
          .toThrowMatching(error => Reflect.get(error, 'code') === 'app/invalid-server-app-environment');
      } finally {
        Reflect.deleteProperty(globalThis, 'window');
      }
      expect(warn).not.toHaveBeenCalled();
    });

    it('lets a native error that is not a token error propagate', () => {
      const warn = spyOn(console, 'warn');
      const throwingOptions: FirebaseOptions = {
        get apiKey(): string {
          throw new RangeError('spec');
        },
        projectId: SPEC_OPTIONS.projectId,
        appId: SPEC_OPTIONS.appId,
      };
      expect(() => configure([], { authIdToken: buildToken({}) }, throwingOptions)).toThrowError(RangeError);
      expect(warn).not.toHaveBeenCalled();
    });

    it('builds a server app for an expired token and releases it', async () => {
      spyOn(console, 'error');
      const warn = spyOn(console, 'warn');
      const app = serverAppOrFail(configure([], { authIdToken: buildToken({ exp: Math.floor(Date.now() / 1000) - 3600 }), releaseAfterRender: 0 }));
      expect(warn).not.toHaveBeenCalled();
      TestBed.resetTestingModule();
      await untilDeleted(app);
    });

    it('warns on the first unparseable token and then every hundredth', () => {
      const warn = spyOn(console, 'warn');
      for (let index = 0; index < 250; index++) {
        configure([{ provide: REQUEST_CONTEXT, useValue: { authIdToken: UNPARSEABLE_TOKEN } }]);
        TestBed.resetTestingModule();
      }
      expect(warn).toHaveBeenCalledTimes(3);
      expect(warn.calls.argsFor(0).join(' ')).toContain('could not be parsed');
      expect(warn.calls.argsFor(1).join(' ')).toContain('100');
      expect(warn.calls.argsFor(2).join(' ')).toContain('200');
      expect(warningText(warn)).not.toContain(UNPARSEABLE_PAYLOAD);
    });
  });

  describe('the note for a request without a context', () => {
    const request = (): Provider => ({ provide: REQUEST, useValue: new Request('http://localhost/account') });

    it('notes once per process when a request arrives with an undefined context', () => {
      const warn = spyOn(console, 'warn');
      configure([request(), { provide: REQUEST_CONTEXT, useValue: undefined }]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warningText(warn)).toContain('handle()');
      TestBed.resetTestingModule();
      configure([request(), { provide: REQUEST_CONTEXT, useValue: undefined }]);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('notes when the context is null', () => {
      const warn = spyOn(console, 'warn');
      configure([request(), { provide: REQUEST_CONTEXT, useValue: null }]);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('says nothing without a request, as in prerendering', () => {
      const warn = spyOn(console, 'warn');
      configure([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('says nothing when the tokens are passed in the settings, as with an Authorization header', () => {
      const warn = spyOn(console, 'warn');
      configure([request(), { provide: REQUEST_CONTEXT, useValue: undefined }], { authIdToken: undefined });
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('a server app whose tokens differ from the requested ones', () => {
    /** A server app built for `token` whose settings were then changed to carry another token. */
    const serverAppWithChangedToken = (): { token: string; existing: FirebaseServerApp } => {
      const token = buildToken({});
      const existing = initializeServerApp(SPEC_OPTIONS, { authIdToken: token });
      existing.settings.authIdToken = buildToken({});
      return { token, existing };
    };

    it('returns the ordinary app and gives its reference back at once in the timed mode', async () => {
      const { token, existing } = serverAppWithChangedToken();
      const warn = spyOn(console, 'warn');
      const app = configure([], { authIdToken: token, releaseAfterRender: 0 });
      expect(isServerApp(app)).toBeFalse();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warningText(warn)).toContain('could not build a server app');
      expect(warningText(warn)).not.toContain(token.split('.')[1]);
      await deleteApp(existing);
      await untilDeleted(existing);
    });

    it('returns the ordinary app and leaves its reference to the collector in the default mode', async () => {
      const { token, existing } = serverAppWithChangedToken();
      const register = spyOnRegistry();
      const warn = spyOn(console, 'warn');
      const app = configure([], { authIdToken: token });
      expect(isServerApp(app)).toBeFalse();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(registrationsFor(register, existing).length).toBe(1);
      await deleteApp(existing);
      await wait(100);
      expect(isDeleted(existing)).toBeFalse();
    });

    it('warns on the first occurrence and then every hundredth', async () => {
      const { token, existing } = serverAppWithChangedToken();
      const warn = spyOn(console, 'warn');
      for (let index = 0; index < 100; index++) {
        configure([], { authIdToken: token, releaseAfterRender: 0 });
        TestBed.resetTestingModule();
      }
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.calls.argsFor(1).join(' ')).toContain('100');
      await deleteApp(existing);
    });
  });

  it('throws outside an injection context', () => {
    expect(() => initializeBrowserOrServerApp(SPEC_OPTIONS)).toThrowError(/initializeBrowserOrServerApp/);
  });
});
