import { type ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import {
  ScreenTrackingService,
  UserTrackingService,
  getAnalytics,
  provideAnalytics,
} from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { environment } from '../environments/environment';
import { appConfig } from './app.config';

const clientConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideMessaging(() => getMessaging()),
    providePerformance(() => getPerformance()),
  ],
};

export const config = mergeApplicationConfig(appConfig, clientConfig);
