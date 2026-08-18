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

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

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

When Angular renders your app on the server, the server does not know which user is visiting. To render the page as that user, pass their Auth ID token to `initializeServerApp`, which gives you a Firebase app that is already signed in as them.

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
import { Auth, idToken } from '@angular/fire/auth';
import { beforeAuthStateChanged } from 'firebase/auth';
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

#### `beforeAuthStateChanged` from `firebase/auth`

One import in the code above is deliberately different from the rest of this guide. `beforeAuthStateChanged` comes from `firebase/auth` rather than `@angular/fire/auth`. AngularFire's version keeps the app marked as busy until its callback first runs, and this callback only runs when someone signs in or out.

Importing it from `@angular/fire/auth` makes `ng build` hang during route extraction and fail with a timeout. That is a bug on our side, tracked in [#3748](https://github.com/angular/angularfire/issues/3748). Once the fix lands, this can be imported from `@angular/fire/auth` like everything else.

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
  angularApp
    .handle(req, { authIdToken: req.cookies?.__session })
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});
```

Keep it where the generated block already was, below the block that serves static files, so real files are still served before Angular tries to render them. The rest of the file, including the part that starts the server, stays as it is.

The second argument to `handle` is what the render reads back as `REQUEST_CONTEXT`.

### 4. Build the server app from the token

In `app.config.ts`, choose the Firebase app based on where the code is running, and pass that app to every Firebase provider:

```ts
import {
  ApplicationConfig,
  PLATFORM_ID,
  REQUEST_CONTEXT,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FirebaseApp,
  initializeApp,
  initializeServerApp,
  provideFirebaseApp,
} from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

const firebaseConfig = { /* ...your Firebase configuration... */ };

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => {
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        return initializeApp(firebaseConfig);
      }
      const requestContext = inject(REQUEST_CONTEXT, { optional: true }) as
        | { authIdToken?: string }
        | null;
      if (!requestContext?.authIdToken) {
        return initializeApp(firebaseConfig);
      }
      return initializeServerApp(firebaseConfig, {
        authIdToken: requestContext.authIdToken,
        releaseOnDeref: requestContext,
      });
    }),
    provideAuth(() => getAuth(inject(FirebaseApp))),
    provideFirestore(() => getFirestore(inject(FirebaseApp))),
    // ...
  ],
};
```

#### Five details make this work

- **Keep exactly one `provideFirebaseApp`.** AngularFire hands you the app you provided only when a single one is registered, and falls back to the default app otherwise. A second registration anywhere in your configuration would make the server app be silently ignored.
- **Pass `inject(FirebaseApp)` to every provider, not just `provideAuth`.** `ng add @angular/fire` writes them without an argument, which resolves the default app. On a signed-in request the factory above builds a server app instead, so a provider that asks for the default app fails outright on a freshly started server.
- **Keep the signed-out fallback.** There is no request context when Angular prerenders a page, and no token when the visitor is signed out, so the fallback builds an ordinary Firebase app and the page renders signed out.
- **Pass `releaseOnDeref`.** It tells the SDK when it may release the server app. The SDK watches the object you give it and releases once that object is garbage collected, so pass one that lives exactly as long as the render, such as the request context itself. Leave it out and the SDK requires you to call `deleteApp` yourself for each server app you create.
- **The cast is needed** because Angular types `REQUEST_CONTEXT` as `unknown`.

AngularFire's [sample app](https://github.com/angular/angularfire/tree/main/sample) does this differently, giving the browser and the server their own `app.config.client.ts` and `app.config.server.ts` instead of deciding at runtime, inside a single `provideFirebaseApp` factory, which of `initializeApp` and `initializeServerApp` to call. That is also fine, and it keeps the server-only code out of the browser bundle, at the cost of an extra file to wire up.

ID tokens are short-lived, and a returning visitor's browser can send one that expired while the tab was closed. The server cannot refresh it, because a user restored from an ID token has no refresh token, so Firebase logs an error and the page renders signed out. The browser then refreshes the token and the page updates.

### Using `REQUEST` instead of a cookie

Angular also exposes the request itself through the `REQUEST` token, so you can read the ID token from an `Authorization` header rather than a cookie. Firebase's [session management with service workers](https://firebase.google.com/docs/auth/web/service-worker-sessions) guide covers attaching that header. Steps 1, 3 and 4 stay the same apart from the server half of the factory, which becomes:

```ts
import { PLATFORM_ID, REQUEST, inject } from '@angular/core';

provideFirebaseApp(() => {
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    return initializeApp(firebaseConfig);
  }
  const request = inject(REQUEST, { optional: true });
  const authIdToken = request?.headers.get('authorization')?.split('Bearer ')[1];
  if (!authIdToken) {
    return initializeApp(firebaseConfig);
  }
  return initializeServerApp(firebaseConfig, {
    authIdToken,
    releaseOnDeref: request,
  });
}),
```

`REQUEST` is a standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), so headers are read with `headers.get(...)`. Angular sets it to `null` during builds, during static site generation, and during route extraction in development, and it is only supplied at all on `RenderMode.Server` routes, so keep the signed-out fallback for those passes.

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
