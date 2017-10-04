# 5. Guard Routes in AngularFire

## Basic example

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule, AngularFireAuthGuard } from 'angularfire2/auth';

import { AppComponent } from './app.component';
import { ItemListComponent } from './item-list/item-list.component';

@NgModule({
    declarations: [
        AppComponent,
        ItemListComponent,
    ],
    imports: [
        BrowserModule,
        AngularFireModule.initializeApp(config),
        AngularFireAuthModule,
        RouterModule.forRoot([
            { path: '',      component: AppComponent },
            { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard] }
        ])
    ],
    providers: [AngularFireAuthGuard],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

## Advanced example

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule, AngularFireAuthGuard, AngularFireAuthGuardOptions } from 'angularfire2/auth';

import { AppComponent } from './app.component';
import { ItemListComponent } from './item-list/item-list.component';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './admin/admin.component';

export const adminCanActivate : AngularFireAuthGuardOptions = {
  claims: () => token => token.admin == true
}

export const loggedInRedirectToItems : AngularFireAuthGuardOptions = {
  claims: () => token => token.user_id == null,
  redirect: ['items']
}

export const redirectToLogin : AngularFireAuthGuardOptions = {
  redirect: ['login']
}

@NgModule({
    declarations: [
        AppComponent,
        ItemListComponent,
    ],
    imports: [
        BrowserModule,
        AngularFireModule.initializeApp(config),
        AngularFireAuthModule,
        RouterModule.forRoot([
            { path: '',      component: AppComponent },
            { path: 'items', component: ItemListComponent, canActivate: [AngularFireAuthGuard], data: { canActivate: redirectToLogin } },
            { path: 'login', component: LoginComponent,    canActivate: [AngularFireAuthGuard], data: { canActivate: loggedInRedirectToItems } },
            { path: 'admin', component: AdminComponent,    canActivate: [AngularFireAuthGuard], data: { canActivate: adminCanActivate } }
        ])
    ],
    providers: [AngularFireAuthGuard],
    bootstrap: [AppComponent]
})
export class AppModule { }
```