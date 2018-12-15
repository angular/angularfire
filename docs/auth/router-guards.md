# Disallow unauthorized users with Router Guards

## Basic example

```ts
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard] },
]
```

## Use our pre-built pipes for common tests

```ts
import { AngularFireAuthGuard, hasCustomClaim, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/auth-guard';

const adminOnly = hasCustomClaim('admin');
const redirectUnauthorizedToLogin = redirectUnauthorizedTo(['login']);
const redirectLoggedInToItems = redirectLoggedInTo(['items']);

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'login', component: LoginComponent,    canActivate: [AngularFireAuthGuard], data: { angularFireAuthPipe: redirectLoggedInToItems }},
    { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard], data: { angularFireAuthPipe: redirectUnauthorizedToLogin },
    { path: 'admin', component: AdminComponent,    canActivate: [AngularFireAuthGuard], data: { angularFireAuthPipe: adminOnly }}
];
```

## Increase readability with our `canActivate` helper

```ts
import { canActivate } from '@angular/fire/auth-guard';

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'login', component: LoginComponent,    ...canActivate(redirectLoggedInToItems) },
    { path: 'items', component: ItemListComponent, ...canActivate(redirectUnauthorizedToLogin) },
    { path: 'admin', component: AdminComponent,    ...canActivate(adminOnly) }
];
```

## Compose your own pipes

```ts
import { pipe, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { customClaims } from '@angular/fire/auth-guard';

const editorOnly = pipe(customClaims, map(claims => claims.role === "editor"));

const redirectToProfileEdit = map(([user]) => !!user && ['profiles', user.uid, 'edit']);

const accountAdmin = switchMap(([user, next]) => 
    user ? user.getIdTokenResult().then(idTokenResult => {
        idTokenResult.claims[`account-${next.params.accountId}-role`] === "admin"
    }) : of(false)
)
```