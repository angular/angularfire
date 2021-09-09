import { NgModule } from '@angular/core';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';
import * as admin from 'firebase-admin';

import { AppModule, FIREBASE_ADMIN } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    ServerTransferStateModule,
  ],
  providers: [{
    provide: FIREBASE_ADMIN, useFactory: () => admin.apps[0] || admin.initializeApp(
      // In Cloud Functions we can auto-initialize
      process.env.FUNCTION_NAME ?
        undefined : {
          credential: admin.credential.applicationDefault(),
          databaseURL: 'https://aftest-94085.firebaseio.com'
        }
      )
  }],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
