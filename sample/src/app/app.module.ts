import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, getApp } from '@angular/fire/app';
import { provideAuth, initializeAuth } from '@angular/fire/auth';
import { initializeApp } from 'firebase/app';
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
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
