import { NgModule } from '@angular/core';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getFunctions, provideFunctions } from '@angular/fire/functions';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    AppModule,
    provideRemoteConfig(() => getRemoteConfig()),
    provideAnalytics(() => getAnalytics()),
    provideMessaging(() => getMessaging()),
    providePerformance(() => getPerformance()),
    provideFunctions(() => getFunctions()),
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {}
