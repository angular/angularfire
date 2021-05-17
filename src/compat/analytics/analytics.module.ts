import { NgModule, Optional } from '@angular/core';
import { ScreenTrackingService } from './screen-tracking.service';
import { AngularFireAnalytics } from './analytics';
import { UserTrackingService } from './user-tracking.service';

@NgModule({
  providers: [ AngularFireAnalytics ]
})
export class AngularFireAnalyticsModule {
  constructor(
    analytics: AngularFireAnalytics,
    @Optional() screenTracking: ScreenTrackingService,
    @Optional() userTracking: UserTrackingService
  ) {
    // calling anything on analytics will eagerly load the SDK
    // tslint:disable-next-line:no-unused-expression
    analytics.app.then(() => {});
  }
}
