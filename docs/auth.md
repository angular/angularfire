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

Provide a Auth instance in the application's `app.config.ts`:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideAuth(() => getAuth()),
    ...
  ],
  ...
})
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
  user$ = user(auth);
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
  authState$ = authState(auth);
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
  idToken$ = idToken(auth);
  idTokenSubscription: Subscription;
  ...

  constructor() {
    this.idTokenSubscription = this.idToken$.subscribe((token: string | null) => {
        //handle idToken changes here. Note, that user will be null if there is no currently logged in user.
     console.log(string);
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
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';

@NgModule({
  imports: [
    provideAuth(() => {
      const auth = getAuth();
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      return auth;
    }),
  ]
})
```
