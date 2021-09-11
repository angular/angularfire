import { isDevMode, NgModule } from '@angular/core';
import { ServerModule, } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { APP_BASE_HREF } from '@angular/common';

import { provideAppCheck, CustomProvider, initializeAppCheck } from '@angular/fire/app-check';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    provideAppCheck(() =>  {
      const provider = new CustomProvider({ getToken: () => Promise.reject() });
      return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
    }),
  ],
  providers: [
    { provide: APP_BASE_HREF, useFactory: () => isDevMode() ? '/us-central1/ssr' : '/ssr' },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
