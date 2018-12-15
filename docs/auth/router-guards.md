# Disallow unauthorized users with Router Guards

## Basic example

```ts
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard] },
]
```

## Using our helpers for common tests

```ts
import { hasClaim, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const adminOnly = hasClaim('admin');
const redirectUnauthorizedToLogin = redirectUnauthorizedTo(['login']);
const redirectLoggedInToItems = redirectLoggedInTo(['items']);

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'login', component: LoginComponent,    ...redirectLoggedInToItems },
    { path: 'items', component: ItemListComponent, ...redirectUnauthorizedToLogin },
    { path: 'admin', component: AdminComponent,    ...adminOnly }
];
```

## Configure the auth guard from scratch

```ts
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin : AngularFireAuthGuardOptions = {
    redirectUnauthorizedTo: ['login']
}

const redirectLoggedInToItems : AngularFireAuthGuardOptions = {
    authorizationCheck: () => idTokenResult => of(!idTokenResult),
    redirectUnauthorizedTo: ['items']
}

const adminOnly : AngularFireAuthGuardOptions = {
    authorizationCheck: () => idTokenResult => of(!!idTokenResult && idTokenResult.claims.hasOwnProperty('admin'))
}

const adminOfProjectOnly : AngularFireAuthGuardOptions = {
    authorizationCheck: (next) => idTokenResult => of(!!idTokenResult && idTokenResult.claims[`project-${next.params.id}`] == 'admin')
}

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard], data: redirectUnauthorizedToLogin },
    { path: 'login', component: LoginComponent,    canActivate: [AngularFireAuthGuard], data: redirectLoggedInToItems },
    { path: 'admin', component: AdminComponent,    canActivate: [AngularFireAuthGuard], data: adminOnly },
    { path: 'p/:id', component: ProjectComponent,  canActivate: [AngularFireAuthGuard], data: adminOfProjectOnly },
]
```

## Increase readability with `routeHelper`

```ts
import { AngularFireAuthGuard, routeHelper } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = routeHelper({ redirectUnauthorizedTo: ['login'] });;

const redirectLoggedInToItems = routeHelper({
    authorizationCheck: () => idTokenResult => of(!idTokenResult),
    redirectUnauthorizedTo: ['items']
});

const adminOnly = routeHelper({
    authorizationCheck: () => idTokenResult => of(!!idTokenResult && idTokenResult.claims.hasOwnProperty('admin'))
});

const adminOfProjectOnly = routeHelper({
    authorizationCheck: (next) => idTokenResult => of(!!idTokenResult && idTokenResult.claims[`project-${next.params.id}`] === 'admin')
});

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, ...redirectUnauthorizedToLogin },
    { path: 'login', component: LoginComponent,    ...redirectLoggedInToItems },
    { path: 'admin', component: AdminComponent,    ...adminOnly },
    { path: 'p/:id', component: ProjectComponent,  ...adminOfProjectOnly },
]
```