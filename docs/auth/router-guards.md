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
const belongsToAccount = (next) => hasCustomClaim(`account-${next.params.id}`);

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'login', component: LoginComponent,        canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectLoggedInToItems }},
    { path: 'items', component: ItemListComponent,     canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin },
    { path: 'admin', component: AdminComponent,        canActivate: [AngularFireAuthGuard], data: { authGuardPipe: adminOnly }},
    { path: 'accounts/:id', component: AdminComponent, canActivate: [AngularFireAuthGuard], data: { authGuardPipe: belongsToAccount }}
];
```

## Increase readability with our `canActivate` helper

```ts
import { canActivate } from '@angular/fire/auth-guard';

export const routes: Routes = [
    { path: '',             component: AppComponent },
    { path: 'login',        component: LoginComponent,    ...canActivate(redirectLoggedInToItems) },
    { path: 'items',        component: ItemListComponent, ...canActivate(redirectUnauthorizedToLogin) },
    { path: 'admin',        component: AdminComponent,    ...canActivate(adminOnly) },
    { path: 'accounts/:id', component: AdminComponent,    ...canActivate(belongsToAccount) }
];
```

## Compose your own pipes

```ts
import { pipe, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { customClaims } from '@angular/fire/auth-guard';

const editorOnly = pipe(customClaims, map(claims => claims.role === "editor"));
const redirectToProfileEditOrLogin = map(user => user ? ['profiles', user.uid, 'edit'] : ['login']);
const onlyAllowSelf = (next) => map(user => !!user && next.params.userId === user.uid);
const accountAdmin = (next) => pipe(customClaims, map(claims => claims[`account-${next.params.accountId}-role`] === "admin"));
```