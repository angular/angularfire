import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';

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
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireModule.initializeApp(environment.firebase, 'second'),
    AngularFireAuthModule.initializeAuth(),
    AngularFireAuthModule.initializeAuth({
      appName: 'second',
      useDeviceLanguage: true,
    }),
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
