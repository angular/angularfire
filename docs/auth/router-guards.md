# Route users with AngularFire guards

`AngularFireAuthGuard` provides a prebuilt [`canActivate` Router Guard](https://angular.io/api/router/CanActivate) using `AngularFireAuth`. By default unauthenticated users are not permitted to navigate to protected routes:

```ts
import { AngularFireAuthGuard } from '@angular/fire/compat/auth-guard';

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard] },
]
```

## Customizing the behavior of `AngularFireAuthGuard`

To customize the behavior of `AngularFireAuthGuard`, you can pass an RXJS pipe through the route data's `authGuardPipe` key.

The `auth-guard` module provides the following pre-built pipes:

| Exported pipe                      | Functionality |
|-|-|
| `loggedIn`                         | The default pipe, rejects if the user is not authenticated. |
| `isNotAnonymous`                   | Rejects if the user is anonymous |
| `emailVerified`                    | Rejects if the user's email is not verified |
| `hasCustomClaim(claim)`            | Rejects if the user does not have the specified claim |
| `redirectUnauthorizedTo(redirect)` | Redirect unauthenticated users to a different route  |
| `redirectLoggedInTo(redirect)`     | Redirect authenticated users to a different route |

Example use:

```ts
import { AngularFireAuthGuard, hasCustomClaim, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/compat/auth-guard';

const adminOnly = () => hasCustomClaim('admin');
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToItems = () => redirectLoggedInTo(['items']);
const belongsToAccount = (next) => hasCustomClaim(`account-${next.params.id}`);

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'login', component: LoginComponent,        canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectLoggedInToItems }},
    { path: 'items', component: ItemListComponent,     canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin }},
    { path: 'admin', component: AdminComponent,        canActivate: [AngularFireAuthGuard], data: { authGuardPipe: adminOnly }},
    { path: 'accounts/:id', component: AdminComponent, canActivate: [AngularFireAuthGuard], data: { authGuardPipe: belongsToAccount }}
];
```

Use the provided `canActivate` helper and spread syntax to make your routes more readable:

```ts
import { canActivate } from '@angular/fire/compat/auth-guard';

export const routes: Routes = [
    { path: '',             component: AppComponent },
    { path: 'login',        component: LoginComponent,    ...canActivate(redirectLoggedInToItems) },
    { path: 'items',        component: ItemListComponent, ...canActivate(redirectUnauthorizedToLogin) },
    { path: 'admin',        component: AdminComponent,    ...canActivate(adminOnly) },
    { path: 'accounts/:id', component: AdminComponent,    ...canActivate(belongsToAccount) }
];
```

### Compose your own pipes

`AngularFireAuthGuard` pipes are RXJS operators which transform an optional User to a boolean or Array (for redirects). You can easily build your own to customize behavior further:

```ts
import { map } from 'rxjs/operators';

// This pipe redirects a user to their "profile edit" page or the "login page" if they're unauthenticated
// { path: 'profile', ...canActivate(redirectToProfileEditOrLogin) }
const redirectToProfileEditOrLogin = () => map(user => user ? ['profiles', user.uid, 'edit'] : ['login']);
```

The `auth-guard` modules provides a `customClaims` operator to reduce boiler plate when checking a user's claims:

```ts
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { customClaims } from '@angular/fire/compat/auth-guard';

// This pipe will only allow users with the editor role to access the route
// { path: 'articles/:id/edit', component: ArticleEditComponent, ...canActivate(editorOnly) }
const editorOnly = () => pipe(customClaims, map(claims => claims.role === 'editor'));
```

### Using router state

`AngularFireAuthGuard` will also accept `AuthPipeGenerator`s which generate `AuthPipe`s given the router state:

```ts
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { customClaims } from '@angular/fire/compat/auth-guard';

// Only allow navigation to the route if :userId matches the authenticated user's uid
// { path: 'user/:userId/edit', component: ProfileEditComponent, ...canActivate(onlyAllowSelf) }
const onlyAllowSelf = (next) => map(user => !!user && next.params.userId === user.uid);

// Only allow navigation to the route if the user has a custom claim matching  :accountId
// { path: 'accounts/:accountId/billing', component: BillingDetailsComponent, ...canActivate(accountAdmin) }
const accountAdmin = (next) => pipe(customClaims, map(claims => claims[`account-${next.params.accountId}-role`] === 'admin'));
```
