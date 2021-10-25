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

AngularFire allows you to work with Firebase Auth via Angular's Dependency Injection.

First provide an auth instance to AngularFire:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

@NgModule({
  imports: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
  ]
})
```

Next inject it into your component:

```ts
import { Auth } from '@angular/fire/auth';

constructor(database: Auth) {
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Just change your imports from `import { ... } from 'firebase/auth'` to `import { ... } from '@angular/fire/auth'` and follow the offical documentation.

[Getting Started](https://firebase.google.com/docs/auth/web/start) | [API Reference](https://firebase.google.com/docs/reference/js/auth)

## Convenience observables

AngularFire provides observables to allow convenient use of the Firebase Authentication with RXJS.

### user

TBD

### authState

TBD

### idToken

TBD


## Connecting the the emulator suite

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