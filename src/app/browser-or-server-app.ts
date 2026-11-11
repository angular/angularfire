import { isPlatformServer } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, REQUEST, REQUEST_CONTEXT, assertInInjectionContext, inject, isDevMode } from '@angular/core';
import { VERSION } from '@angular/fire';
import {
  FirebaseApp,
  FirebaseAppSettings,
  FirebaseOptions,
  FirebaseServerApp,
  FirebaseServerAppSettings,
  deleteApp,
  initializeApp,
  initializeServerApp,
  registerVersion,
} from 'firebase/app';

export type BrowserOrServerAppSettings = Omit<FirebaseServerAppSettings, 'releaseOnDeref'> & {
  /**
   * Passing this is a compile error, which is why it is typed `never`. The Firebase SDK's
   * `releaseOnDeref` releases the server app when the object it is given is garbage collected.
   * `initializeBrowserOrServerApp` manages that release itself, and a server app released twice
   * can be deleted while another render is still using it. Use `releaseAfterRender` to change
   * when the release happens.
   */
  releaseOnDeref?: never;
  /**
   * How long the server app built for a render outlives that render, in milliseconds.
   *
   * Each signed-in server render gets a FirebaseServerApp, and building one costs a Firestore
   * connection and an account lookup. The app is cached by the Firebase SDK, so a later render for
   * the same visitor can reuse it as long as it is still alive. This setting decides when it dies.
   *
   * - Left out (the default): the app lives until Node garbage-collects the finished render, the
   *   same as `releaseOnDeref` in a hand-written setup. Repeat renders reuse it, and memory is
   *   bounded by the garbage collector.
   * - `0`: the app is released as soon as the render ends. Memory is bounded by the renders in
   *   flight, and every repeat render pays the build cost again.
   * - A positive number: the app is kept for that long after the render ends, so a reload or a
   *   second tab inside that window reuses it. Values above 2147483647 (about 24.8 days) are
   *   capped there.
   *
   * Example: `initializeBrowserOrServerApp(firebaseConfig, { releaseAfterRender: 60_000 })`.
   */
  releaseAfterRender?: number;
};

const RELEASE_FAILED_MESSAGE = 'AngularFire: releasing the server app after the render failed.';
const UNPARSEABLE_TOKEN_MESSAGE = 'AngularFire: the ID token or App Check token for this render could not be parsed, so the page renders signed out. Find more at https://github.com/angular/angularfire/blob/main/docs/auth.md';
const MISSING_REQUEST_CONTEXT_MESSAGE = 'AngularFire: this server render has a request but no request context, so no ID token or App Check token can be read. Pass the context as the second argument of handle() in server.ts. Find more at https://github.com/angular/angularfire/blob/main/docs/auth.md';
const TOKEN_MISMATCH_MESSAGE = 'AngularFire: could not build a server app for the tokens of this render, so the page renders signed out.';

// setTimeout fires at once for any delay above this.
const MAX_TIMER_DELAY = 2147483647;

const warningCounts = new Map<string, number>();
let notedMissingRequestContext = false;

/** Resets this file's once-per-process warnings for specs, which share one process. */
export const ɵresetBrowserOrServerAppWarnings = (): void => {
  warningCounts.clear();
  notedMissingRequestContext = false;
};

/**
 * Lives as long as the request's root injector and is handed to the SDK as `releaseOnDeref`, so
 * the server app is released when the garbage collector reclaims it. As a service it is dropped
 * in the `finally` of that injector's destroy, which runs even when a service's `ngOnDestroy`
 * throws.
 */
@Injectable({ providedIn: 'root' })
export class ɵRequestLifetime {}

/** The two tokens a render can carry, each `undefined` when absent. */
interface RenderTokens {
  authIdToken: string | undefined;
  appCheckToken: string | undefined;
}

// Logged in full once per process, then one line per hundred, so a token that keeps failing cannot add a line of ours per request.
const warnRateLimited = (message: string, repeatLine: (count: number) => string): void => {
  const count = (warningCounts.get(message) ?? 0) + 1;
  warningCounts.set(message, count);
  if (count === 1) {
    console.warn(message);
  } else if (count % 100 === 0) {
    console.warn(repeatLine(count));
  }
};

/**
 * A request with no context, and no token passed in, is the shape of a server.ts that forgot
 * handle()'s second argument. Prerendering has no request, and the context is undefined, not
 * null, when the argument is missing.
 */
const noteMissingRequestContext = (request: Request | null, requestContext: unknown, settings: BrowserOrServerAppSettings): void => {
  const tokensPassedIn = 'authIdToken' in settings || 'appCheckToken' in settings;
  if (!isDevMode() || request === null || (requestContext !== null && requestContext !== undefined) || tokensPassedIn || notedMissingRequestContext) {
    return;
  }
  notedMissingRequestContext = true;
  console.warn(MISSING_REQUEST_CONTEXT_MESSAGE);
};

// Compared by name, not instanceof: a second copy of @firebase/util would make instanceof miss, and the SDK's own errors are FirebaseError.
const isTokenParseError = (error: unknown): boolean => {
  const name = typeof error === 'object' && error !== null ? Reflect.get(error, 'name') : undefined;
  return name === 'SyntaxError' || name === 'TypeError';
};

const readStringProperty = (value: unknown, key: string): string | undefined => {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }
  const property = Reflect.get(value, key);
  return typeof property === 'string' ? property : undefined;
};

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/** A non-empty token in the settings wins, then a non-empty one in the request context. */
const readTokens = (settings: BrowserOrServerAppSettings, requestContext: unknown): RenderTokens => ({
  authIdToken: nonEmptyString(settings.authIdToken) ?? nonEmptyString(readStringProperty(requestContext, 'authIdToken')),
  appCheckToken: nonEmptyString(settings.appCheckToken) ?? nonEmptyString(readStringProperty(requestContext, 'appCheckToken')),
});

const release = (serverApp: FirebaseServerApp): void => {
  deleteApp(serverApp).catch((error: unknown) => console.warn(RELEASE_FAILED_MESSAGE, error));
};

const hasUnref = (timer: unknown): timer is { unref: () => void } =>
  typeof timer === 'object' && timer !== null && typeof Reflect.get(timer, 'unref') === 'function';

const scheduleRelease = (serverApp: FirebaseServerApp, delay: number): void => {
  if (delay <= 0) {
    release(serverApp);
    return;
  }
  // A pending release must not keep a server process from exiting.
  const timer: unknown = setTimeout(() => release(serverApp), Math.min(delay, MAX_TIMER_DELAY));
  if (hasUnref(timer)) {
    timer.unref();
  }
};

/**
 * Builds the server app for a render's tokens and arranges its release, or returns `undefined`
 * when the ordinary app should be used instead: a token the SDK cannot parse, or an app whose
 * tokens are not the ones asked for.
 */
const buildServerApp = (
  options: FirebaseOptions,
  settings: BrowserOrServerAppSettings,
  appSettings: FirebaseAppSettings,
  tokens: RenderTokens,
  destroyRef: DestroyRef,
): FirebaseServerApp | undefined => {
  const { releaseOnDeref: _releaseOnDeref, releaseAfterRender, automaticDataCollectionEnabled: _automaticDataCollectionEnabled, ...serverSettings } = settings;
  const timedRelease = releaseAfterRender !== undefined || typeof FinalizationRegistry === 'undefined';

  let serverApp: FirebaseServerApp;
  try {
    serverApp = initializeServerApp(options, {
      ...serverSettings,
      ...appSettings,
      ...tokens,
      ...(timedRelease ? {} : { releaseOnDeref: inject(ɵRequestLifetime) }),
    });
  } catch (error) {
    if (!isTokenParseError(error)) {
      throw error;
    }
    warnRateLimited(UNPARSEABLE_TOKEN_MESSAGE, count => `AngularFire: ${count} renders in this process carried a token that could not be parsed.`);
    return undefined;
  }

  if (serverApp.settings.authIdToken !== tokens.authIdToken || serverApp.settings.appCheckToken !== tokens.appCheckToken) {
    if (timedRelease) {
      release(serverApp);
    }
    warnRateLimited(TOKEN_MISMATCH_MESSAGE, count => `AngularFire: ${count} renders in this process could not build a server app for their tokens.`);
    return undefined;
  }

  if (timedRelease) {
    // Inside an environment injector DestroyRef is the injector itself, so this runs when the render's injector is destroyed.
    destroyRef.onDestroy(() => scheduleRelease(serverApp, releaseAfterRender ?? 0));
  }
  return serverApp;
};

/**
 * Call inside provideFirebaseApp. In the browser it returns the ordinary Firebase app. On the
 * server it returns a FirebaseServerApp for the visitor's ID token and App Check token when
 * either is present, read from the request context handed to handle() in server.ts or passed in
 * the settings, and the ordinary app when neither is.
 *
 * It always builds the default app. Keep exactly one provideFirebaseApp, and pass
 * inject(FirebaseApp) to every product provider, since the server app is not the default app.
 * An application with several Firebase projects writes its own provideFirebaseApp callback
 * instead. FirebaseApps and firebaseApp$ list ordinary apps only, never a server app.
 */
export function initializeBrowserOrServerApp(
  options: FirebaseOptions,
  settings: BrowserOrServerAppSettings = {},
): FirebaseApp {
  assertInInjectionContext(initializeBrowserOrServerApp);
  const platformId = inject(PLATFORM_ID);
  const requestContext = inject(REQUEST_CONTEXT, { optional: true });
  const request = inject(REQUEST, { optional: true });
  const destroyRef = inject(DestroyRef);
  registerVersion('angularfire', VERSION.full, 'browser-or-server-app');

  // The key must be absent, not undefined: the SDK deep-compares settings with an existing default app.
  const appSettings: FirebaseAppSettings =
    settings.automaticDataCollectionEnabled === undefined ? {} : { automaticDataCollectionEnabled: settings.automaticDataCollectionEnabled };

  if (!isPlatformServer(platformId)) {
    return initializeApp(options, appSettings);
  }

  noteMissingRequestContext(request, requestContext, settings);

  const tokens = readTokens(settings, requestContext);
  if (tokens.authIdToken === undefined && tokens.appCheckToken === undefined) {
    return initializeApp(options, appSettings);
  }

  return buildServerApp(options, settings, appSettings, tokens, destroyRef) ?? initializeApp(options, appSettings);
}
