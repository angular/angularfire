import { NgModule } from '@angular/core';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider, AppCheckModule } from '@angular/fire/app-check';
import { environment } from 'src/environments/environment';

@NgModule({
  imports: [
    AppModule,
    ...[
      environment.useEmulators ? [AppCheckModule] : [
        provideAppCheck(() =>  {
          const provider = new ReCaptchaV3Provider(environment.recaptcha3SiteKey);
          return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
        })
      ]
    ]
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {}
