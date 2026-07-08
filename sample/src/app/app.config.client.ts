import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';

import { appConfig } from './app.config';

import { environment } from '../environments/environment';

const clientConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideMessaging(() => getMessaging()),
    providePerformance(() => getPerformance()),
  ]
};

export const config = mergeApplicationConfig(appConfig, clientConfig);
