# Disallow unauthorized users with Router Guards

## Basic example

```ts
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard] },
]
```

## Advanced examples

```ts
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';

const redirectToLogin : AngularFireAuthGuardOptions = {
    redirectUnauthorizedTo: ['login']
}

const loggedInRedirectToItems : AngularFireAuthGuardOptions = {
    authorizationCheck: () => idTokenResult => of(!idTokenResult),
    redirectUnauthorizedTo: ['items']
}

const adminOnly : AngularFireAuthGuardOptions = {
    authorizationCheck: () => idTokenResult => of(!!idTokenResult && idTokenResult.claims.admin == true)
}

const adminOfProjectOnly : AngularFireAuthGuardOptions = {
    authorizationCheck: (next) => idTokenResult => of(!!idTokenResult && idTokenResult.claims[`project-${next.params.id}`] == 'admin')
}

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard], data: redirectToLogin },
    { path: 'login', component: LoginComponent,    canActivate: [AngularFireAuthGuard], data: loggedInRedirectToItems },
    { path: 'admin', component: AdminComponent,    canActivate: [AngularFireAuthGuard], data: adminOnly },
    { path: 'p/:id', component: ProjectComponent,  canActivate: [AngularFireAuthGuard], data: adminOfProjectOnly },
]
```

## Increase readability with `routeHelper`

```ts
import { AngularFireAuthGuard, routeHelper } from '@angular/fire/auth-guard';

const redirectToLogin = routeHelper({ redirectUnauthorizedTo: ['login'] });;

const loggedInRedirectToItems = routeHelper({
    authorizationCheck: () => idTokenResult => of(!idTokenResult),
    redirectUnauthorizedTo: ['items']
});

const adminOnly = routeHelper({
    authorizationCheck: () => idTokenResult => of(!!idTokenResult && idTokenResult.claims.admin == true)
});

const adminOfProjectOnly = routeHelper({
    authorizationCheck: (next) => idTokenResult => of(!!idTokenResult && idTokenResult.claims[`project-${next.params.id}`] == 'admin')
});

export const routes: Routes = [
    { path: '',      component: AppComponent },
    { path: 'items', component: ItemListComponent, ...redirectToLogin },
    { path: 'login', component: LoginComponent,    ...loggedInRedirectToItems },
    { path: 'admin', component: AdminComponent,    ...adminOnly },
    { path: 'p/:id', component: ProjectComponent,  ...adminOfProjectOnly },
]
```