import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { provideAppCheck, CustomProvider, initializeAppCheck } from '@angular/fire/app-check';
import * as admin from 'firebase-admin';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { environment } from 'src/environments/environment';

const firebaseAdminApp = admin.apps[0] || admin.initializeApp(
  // In Cloud Functions we can auto-initialize
  process.env.FUNCTION_NAME ? undefined : {
    credential: admin.credential.applicationDefault(),
    databaseURL: environment.firebase.databaseURL,
  }
);

const appCheckToken = firebaseAdminApp.appCheck().createToken(environment.firebase.appId, {
  ttlMillis: 604_800_000, // 1 week
}).then(({ token, ttlMillis: expireTimeMillis }) => ({ token, expireTimeMillis } ));

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    provideAppCheck(() =>  {
      const provider = new CustomProvider({ getToken: () => appCheckToken });
      return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: false });
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
