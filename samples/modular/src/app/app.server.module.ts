import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { provideAppCheck, CustomProvider, initializeAppCheck } from '@angular/fire/app-check';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    provideAppCheck(() =>  {
      const provider = new CustomProvider({ getToken: () => Promise.reject() });
      return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
