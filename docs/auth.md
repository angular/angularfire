<img align="right" width="30%" src="images/auth-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Authentication
</small>

# Authentication

Most apps need to know the identity of a user. Knowing a user's identity allows an app to securely save user data in the cloud and provide the same personalized experience across all of the user's devices.
Firebase Authentication provides backend services, easy-to-use SDKs, and ready-made UI libraries to authenticate users to your app. It supports authentication using passwords, phone numbers, popular federated identity providers like Google, Facebook and Twitter, and more.

Firebase Authentication integrates tightly with other Firebase services, and it leverages industry standards like OAuth 2.0 and OpenID Connect, so it can be easily integrated with your custom backend.

[Learn more about Firebase Authentication](https://firebase.google.com/docs/auth)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project as described in the [Quickstart](./install-and-setup.md).

Provide an Auth instance in the application's `app.config.ts`:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideAuth(() => getAuth()),
    ...
  ],
  ...
}
```

Next inject `Auth` into your component:

```ts
import { Component, inject} from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Component({ ... })
export class LoginComponent {
  private auth = inject(Auth);
  ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/auth'` to `import { ... } from '@angular/fire/auth'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/auth/web/start) | [API Reference](https://firebase.google.com/docs/reference/js/auth)

## Server-side Rendering

When Angular renders your app on the server, the server does not know which user is visiting. To render the page as that user, hand their Auth ID token to `initializeBrowserOrServerApp`, which gives you a Firebase app that is already signed in as them on the server, and the ordinary Firebase app in the browser.

Getting the token to the server is your app's job. This guide keeps it in a cookie, because the browser attaches cookies to every request on its own.

All 4 steps below are required. Miss any one of them and the page still renders, but it renders signed out, with no error to tell you why.

### 1. Serve the route with `RenderMode.Server`

`ng new --ssr` scaffolds `app.routes.server.ts` with every route set to `RenderMode.Prerender`. Prerendering runs at build time, so there is no request and no cookie, and Angular provides neither `REQUEST` nor `REQUEST_CONTEXT`. Any route that must already render as the signed-in user before hydration has to be `RenderMode.Server`. A `RenderMode.Client` route renders in the browser, where the user is already signed in, so it needs none of this.

```ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'account', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];
```

The rest of this guide has no effect on routes rendered any other way.

The request context that step 3 fills and step 4 reads is provided by `AngularNodeAppEngine` and `AngularAppEngine`, the engines `ng new --ssr` sets up. An app still rendering through the older `CommonEngine` has to provide it itself, on every render:

```ts
engine.render({ ...renderOptions, providers: [{ provide: REQUEST_CONTEXT, useValue: { authIdToken } }] })
```

### 2. Keep the ID token in a cookie

Install [js-cookie](https://github.com/js-cookie/js-cookie):

```bash
npm install js-cookie
npm install --save-dev @types/js-cookie
```

Add the cookie sync to your `app.config.ts`. AngularFire's `idToken` observable emits on sign-in, on sign-out, and whenever the token is refreshed.

```ts
import { DestroyRef, PLATFORM_ID, inject, provideAppInitializer } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// on AngularFire 20.1.0 and earlier, or 21.0.0-rc.0 and rc.1, import beforeAuthStateChanged from firebase/auth (see note below)
import { Auth, beforeAuthStateChanged, idToken } from '@angular/fire/auth';
import cookies from 'js-cookie';

// add to appConfig.providers
provideAppInitializer(() => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return;
  }
  const auth = inject(Auth);
  const destroyRef = inject(DestroyRef);

  const writeSessionCookie = (token: string | undefined) => {
    if (token) {
      cookies.set('__session', token, { secure: true, sameSite: 'lax' });
    } else {
      cookies.remove('__session');
    }
  };

  idToken(auth)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((token) => writeSessionCookie(token ?? undefined));

  let priorToken: string | undefined;
  const unsubscribe = beforeAuthStateChanged(
    auth,
    async (user) => {
      // Must update the cookie before the sign-out completes, otherwise a page
      // load that races it still sends the signed-out user's token.
      priorToken = cookies.get('__session');
      writeSessionCookie(await user?.getIdToken());
    },
    () => writeSessionCookie(priorToken)
  );
  destroyRef.onDestroy(unsubscribe);
}),
```

The 2 hooks cover different moments:
- `idToken` fires after an auth state change has completed, and also when Firebase refreshes the token in the background, which is what keeps the cookie current.
- `beforeAuthStateChanged` fires earlier, while an auth state change is still in progress and before Firebase sets the new user, so a page load that races a sign-out cannot send a token for the user who just left and get their data rendered back. Its third argument puts the cookie back if another blocking callback rejects the auth state change.

Name the cookie `__session`. Behind Firebase Hosting it is the [only cookie forwarded](https://firebase.google.com/docs/hosting/manage-cache#using_cookies) to your server code, and any other name is dropped before your app sees it.

#### Both attributes matter

The cookie sync above sets `{ secure: true, sameSite: 'lax' }`, and neither attribute is optional.

- `secure` keeps the cookie off unencrypted connections. Browsers make an exception for `localhost`, so local development still works.
- `sameSite: 'lax'` keeps the cookie off cross-site requests while still sending it when someone follows a link into your app, which is what lets that first page render signed in. If your app never needs a signed-in first render from an external link, use `'strict'` instead.

#### What this cookie carries

This cookie carries a short-lived ID token that scripts on your page can read. Firebase already keeps the signed-in state in browser storage, so the cookie does not create a new place for a token to be stolen from, but it does travel on every request.

If you need a session the browser cannot read, use Firebase's [session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies) with the Admin SDK instead. Those cannot be handed to `initializeServerApp`, so that approach means verifying the cookie yourself and building your own server-side Auth context.

#### On AngularFire 20.1.0 and earlier, or 21.0.0-rc.0 and rc.1

On these releases, import `beforeAuthStateChanged` from `firebase/auth` instead of `@angular/fire/auth`. Otherwise it keeps the app marked as busy until its callback first runs, and this callback only runs when someone signs in or out ([#3748](https://github.com/angular/angularfire/issues/3748)). The fix shipped in AngularFire 20.1.1 and 21.0.0-rc.2.

### 3. Pass the cookie into the render

Install [cookie-parser](https://github.com/expressjs/cookie-parser):

```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

The `server.ts` the Angular CLI generated already renders your app for every request that is not a static file. Replace that existing `app.use` block with this one, which reads the cookie and hands the token to the render. Do not add a second block, because the first one to match wins and the token would never arrive:

```ts
// server.ts
import cookieParser from 'cookie-parser';

app.use(cookieParser());

app.use((req, res, next) => {
  // A page rendered for one visitor must never be served to another from a cache.
  res.setHeader('Cache-Control', 'private, no-store');
  angularApp
    .handle(req, { authIdToken: req.cookies?.__session })
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});
```

Keep it where the generated block already was, below the block that serves static files, so real files are still served before Angular tries to render them. The rest of the file, including the part that starts the server, stays as it is.

The second argument to `handle` is what the render reads back as `REQUEST_CONTEXT`, and `initializeBrowserOrServerApp` reads the `authIdToken` key from it. If you forget the second argument, AngularFire says so once in the server console in development mode.

The `Cache-Control` header is not optional. A signed-in render puts that visitor's data into the HTML, so a CDN or proxy that cached the response would hand it to the next visitor.

### 4. Build the app with `initializeBrowserOrServerApp`

In `app.config.ts`, build the Firebase app with `initializeBrowserOrServerApp` and pass that app to every Firebase provider:

```ts
import { ApplicationConfig, inject } from '@angular/core';
import { FirebaseApp, initializeBrowserOrServerApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

const firebaseConfig = { /* ...your Firebase configuration... */ };

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeBrowserOrServerApp(firebaseConfig)),
    provideAuth(() => getAuth(inject(FirebaseApp))),
    provideFirestore(() => getFirestore(inject(FirebaseApp))),
    // ...
  ],
};
```

`initializeBrowserOrServerApp` returns the right kind of app for where the code is running:

- In the browser, the ordinary Firebase app, as `initializeApp(firebaseConfig)` would.
- On the server, when the request context carries an `authIdToken`, a [`FirebaseServerApp`](https://firebase.google.com/docs/web/ssr-apps) signed in as that visitor. The same goes for an `appCheckToken`, see [Relaying the App Check token](#relaying-the-app-check-token).
- On the server with neither token, which is what prerendering and a signed-out visitor look like, the ordinary Firebase app, so the page renders signed out.
- On the server with a token Firebase cannot parse, the ordinary Firebase app after a warning in the server console, so the page renders signed out instead of failing the request.

#### Three details make this work

- **Keep exactly one `provideFirebaseApp`.** AngularFire hands you the app you provided only when a single one is registered, and falls back to the default app otherwise. With a second registration anywhere in your configuration, a signed-in render asks for a default app that does not exist on a freshly started server and fails.
- **Pass `inject(FirebaseApp)` to every provider, not just `provideAuth`.** `ng add @angular/fire` writes them without an argument, which resolves the default app. On a signed-in request the app is a server app instead, so a provider that asks for the default app fails outright on a freshly started server.
- **Never call `deleteApp` on the injected app.** `initializeBrowserOrServerApp` releases the server app itself. A second release from your code can delete an app another render is still using.

#### When the server app is released

By default the server app is released once the render has been garbage collected, which is also what the manual setup below does. Until then, a repeat request from the same visitor, such as a reload or a link opened in a new tab, reuses the app, and that reuse is what keeps such a request as fast as a signed-out one. A fresh server app costs a new Firestore connection and an account lookup, about 300 to 400 ms before the HTML is sent.

To release at a fixed time instead, pass `releaseAfterRender`: `0` releases the app when the render ends, which bounds memory to the renders in flight and pays that cost on every repeat request, and a positive number keeps the app for that many milliseconds after the render ends.

```ts
provideFirebaseApp(() => initializeBrowserOrServerApp(firebaseConfig, { releaseAfterRender: 60_000 })),
```

A runtime without `FinalizationRegistry` cannot release at garbage collection, so the app is released when the render ends there whatever the setting.

With `releaseAfterRender` set, the release runs when Angular destroys the render, after your services' `ngOnDestroy` hooks. A service whose `ngOnDestroy` throws stops that teardown, so the server app is never released and one stays behind for every signed-in render. The default release does not depend on teardown and is not affected.

AngularFire's [sample app](https://github.com/angular/angularfire/tree/main/sample) gives the browser and the server their own `app.config.client.ts` and `app.config.server.ts`. `initializeBrowserOrServerApp` works there too, in the server file, with the client file keeping `initializeApp`.

ID tokens are short-lived, and a returning visitor's browser can send one that expired while the tab was closed. The server cannot refresh it, because a user restored from an ID token has no refresh token, so Firebase logs an error and the page renders signed out. The browser then refreshes the token and the page updates. A token that cannot be parsed at all, such as a cookie another site set under the same name, also renders signed out, with one warning in the server console.

If you would rather build the app yourself, or your AngularFire version has no `initializeBrowserOrServerApp`, see [Building the app yourself](#building-the-app-yourself) below.

### Using `REQUEST` instead of a cookie

Angular also exposes the request itself through the `REQUEST` token, so you can read the ID token from an `Authorization` header rather than a cookie. Firebase's [session management with service workers](https://firebase.google.com/docs/auth/web/service-worker-sessions) guide covers attaching that header. Steps 1, 3 and 4 stay the same apart from the call in step 4, which passes the token explicitly:

```ts
import { REQUEST, inject } from '@angular/core';

provideFirebaseApp(() => initializeBrowserOrServerApp(firebaseConfig, {
  authIdToken: inject(REQUEST, { optional: true })?.headers.get('authorization')?.split('Bearer ')[1],
})),
```

`REQUEST` is a standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), so headers are read with `headers.get(...)`. Angular sets it to `null` during builds, during static site generation, and during route extraction in development, and it is only supplied at all on `RenderMode.Server` routes. A missing header gives `undefined`, and `initializeBrowserOrServerApp` then looks in the request context and falls back to the ordinary app.

### Relaying the App Check token

If you [enforce App Check](https://firebase.google.com/docs/app-check/enable-enforcement) for a Firebase product, server renders need an App Check token too, or their requests are rejected. The server cannot mint one, so the browser relays its own, and `initializeBrowserOrServerApp` passes it to the server app as `appCheckToken`.

Relay the ordinary token from `getToken`, not a limited-use one. Replay protection only applies where a backend consumes the token, such as a callable Cloud Function with `consumeAppCheckToken`, and product enforcement for Firestore, Realtime Database and Storage does not.

Keep both tokens in the one `__session` cookie, since behind Firebase Hosting no other cookie reaches your server. In the cookie sync from step 2, write the cookie as JSON and rewrite it whenever either token changes:

```ts
import { AppCheck } from '@angular/fire/app-check';
// imported from firebase/app-check so a token that never arrives does not hold the app busy
import { getToken, onTokenChanged } from 'firebase/app-check';

const appCheck = inject(AppCheck, { optional: true });
let authIdToken: string | undefined;
let appCheckToken: string | undefined;

const writeSessionCookie = () => {
  if (!authIdToken && !appCheckToken) {
    cookies.remove('__session');
    return;
  }
  cookies.set('__session', JSON.stringify({ authIdToken, appCheckToken }), { secure: true, sameSite: 'lax' });
};

idToken(auth)
  .pipe(takeUntilDestroyed(destroyRef))
  .subscribe((token) => {
    authIdToken = token ?? undefined;
    writeSessionCookie();
  });

if (appCheck) {
  destroyRef.onDestroy(onTokenChanged(appCheck, (result) => {
    appCheckToken = result.token;
    writeSessionCookie();
  }));
  getToken(appCheck).then((result) => {
    appCheckToken = result.token;
    writeSessionCookie();
  });
}
```

The `beforeAuthStateChanged` part of step 2 stays as it is, writing `authIdToken` and calling `writeSessionCookie()` instead of passing the token in. In `server.ts`, unpack the cookie and pass both keys:

```ts
const readSessionCookie = (value: unknown): { authIdToken?: string; appCheckToken?: string } => {
  if (typeof value !== 'string') {
    return {};
  }
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  angularApp
    .handle(req, readSessionCookie(req.cookies?.__session))
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});
```

Three things to know before relaying it:

- **Every visitor's first server render builds a server app.** An App Check token is per device, so even signed-out visitors get a server app carrying it, and that first render pays the 300 to 400 ms described above. Relay the token only if you enforce App Check.
- **A stale cookie fails the first request after the token's lifetime.** The browser rewrites the cookie only after the page's JavaScript has run and Firebase has refreshed the token. A visitor who returns after about an hour sends the old one, so that first server render's Firebase requests are rejected under enforcement, and the page shows whatever your app shows for a failed read until it hydrates and reads again. For the ID token the same stale first request only means a signed-out render. If that first render must succeed, Firebase's [service-worker relay](https://firebase.google.com/docs/web/ssr-apps#use-app-check) refreshes the token before the request leaves the browser, at the cost of a service worker your app registers itself.
- **A relayed token wins over `APP_CHECK_ON_SERVER` for Firestore.** When the server app carries an `appCheckToken`, Firestore sends it whatever App Check instance the server holds.

### Building the app yourself

If you would rather build the app yourself, or your AngularFire version does not export `initializeBrowserOrServerApp`, choose the app in step 4 with your own callback. The `try` around `initializeServerApp` is what keeps a token Firebase cannot parse from failing the request with an HTTP 500, and `releaseOnDeref` is what releases the server app, the way `initializeBrowserOrServerApp` does by default:

```ts
import { PLATFORM_ID, REQUEST_CONTEXT, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp, initializeServerApp } from '@angular/fire/app';

const hasAuthIdToken = (value: unknown): value is { authIdToken: string } =>
  typeof value === 'object' && value !== null && typeof Reflect.get(value, 'authIdToken') === 'string';

provideFirebaseApp(() => {
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    return initializeApp(firebaseConfig);
  }
  const requestContext = inject(REQUEST_CONTEXT, { optional: true });
  if (!hasAuthIdToken(requestContext) || !requestContext.authIdToken) {
    return initializeApp(firebaseConfig);
  }
  try {
    return initializeServerApp(firebaseConfig, {
      authIdToken: requestContext.authIdToken,
      releaseOnDeref: requestContext,
    });
  } catch {
    return initializeApp(firebaseConfig);
  }
}),
```

Keep the signed-out fallback, since there is no request context when Angular prerenders a page and no token when the visitor is signed out, and keep the first two of the three details above. An app that already has this callback can switch to `initializeBrowserOrServerApp` in one deploy. The callback keeps working on later versions too.

## Convenience observables

AngularFire provides observables to allow convenient use of the Firebase Authentication with RXJS.

### user

The `user` observable streams events triggered by sign-in, sign-out, and token refresh events.

Example code:

```ts
import { Auth, User, user } from '@angular/fire/auth';
...

export class UserComponent implements OnDestroy {
  private auth: Auth = inject(Auth);
  user$ = user(this.auth);
  userSubscription: Subscription;
  ...

  constructor() {
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
        //handle user state changes here. Note, that user will be null if there is no currently logged in user.
     console.log(aUser);
    })
  }

  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.userSubscription.unsubscribe();
  }
}

```

### authState

The `authState` observable streams events triggered by sign-in and sign-out events.

Example code:
```ts
import { Auth, authState } from '@angular/fire/auth';
...

export class UserComponent implements OnDestroy {
  private auth: Auth = inject(Auth);
  authState$ = authState(this.auth);
  authStateSubscription: Subscription;
  ...

  constructor() {
    this.authStateSubscription = this.authState$.subscribe((aUser: User | null) => {
        //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
     console.log(aUser);
    })
  }

  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.authStateSubscription.unsubscribe();
  }
}
```

### idToken

The `idToken` observable streams events triggered by sign-in, sign-out and token refresh events.

Example code:
```ts
import { Auth, idToken } from '@angular/fire/auth';
...

export class UserComponent implements OnDestroy {
  private auth: Auth = inject(Auth);
  idToken$ = idToken(this.auth);
  idTokenSubscription: Subscription;
  ...

  constructor() {
    this.idTokenSubscription = this.idToken$.subscribe((token: string | null) => {
        //handle idToken changes here. Note, that token will be null if there is no currently logged in user.
     console.log(token);
    })
  }

  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.idTokenSubscription.unsubscribe();
  }
}
```

## Connecting the emulator suite

```ts
import { ApplicationConfig, inject } from '@angular/core';
import { FirebaseApp, provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideAuth(() => {
      const auth = getAuth(inject(FirebaseApp));
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      return auth;
    }),
  ]
}
```
