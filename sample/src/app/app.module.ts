import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideAuth } from '@angular/fire/auth';
import { initializeApp, getApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { provideFirestore } from '@angular/fire/firestore/lite';
import { getFirestore } from 'firebase/firestore/lite';

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
    provideFirestore(() => getFirestore()),
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
