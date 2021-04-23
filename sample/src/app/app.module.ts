import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, provideAuth } from '@angular/fire';
import { initializeApp, getApp } from 'firebase/app';
import { initializeAuth } from '@firebase/auth';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirebaseApp(() => {
      const app = initializeApp(environment.firebase, 'second');
      app.automaticDataCollectionEnabled = false;
      return app;
    }),
    provideAuth(() => initializeAuth(getApp())),
    provideAuth(() => {
      const auth = initializeAuth(getApp('second'));
      auth.useDeviceLanguage();
      return auth;
    }),
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
