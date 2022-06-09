import { NgModule } from '@angular/core';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

@NgModule({
  imports: [
    AppModule,
    provideAppCheck(() =>  {
      const provider = new ReCaptchaV3Provider(environment.recaptcha3SiteKey);
      return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {}
