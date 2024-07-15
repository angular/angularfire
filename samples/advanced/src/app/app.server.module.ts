import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import * as admin from 'firebase-admin';

import { environment } from 'src/environments/environment';
import { AppComponent } from './app.component';
import { AppModule, FIREBASE_ADMIN } from './app.module';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
  ],
  providers: [
    { provide: FIREBASE_ADMIN, useFactory: () => admin.apps[0] || admin.initializeApp(
      // In Cloud Functions we can auto-initialize
      process.env.FUNCTION_NAME ? undefined : {
        credential: admin.credential.applicationDefault(),
        databaseURL: environment.firebase.databaseURL,
      }
    ) }
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
