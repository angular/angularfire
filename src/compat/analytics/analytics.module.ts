import { NgModule, Optional } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
import { AngularFireAnalytics } from './analytics';
import { ScreenTrackingService } from './screen-tracking.service';
import { UserTrackingService } from './user-tracking.service';

@NgModule({
  providers: [ AngularFireAnalytics ]
})
export class AngularFireAnalyticsModule {
  constructor(
    analytics: AngularFireAnalytics,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Optional() screenTracking: ScreenTrackingService,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Optional() userTracking: UserTrackingService,
  ) {
    firebase.registerVersion('angularfire', VERSION.full, 'analytics-compat');
    // calling anything on analytics will eagerly load the SDK
    analytics.app.then(() => undefined);
  }
}
