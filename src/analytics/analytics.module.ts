import { NgModule, Optional } from '@angular/core';
import { ScreenTrackingService, UserTrackingService } from './analytics.service';
import { AngularFireAnalytics } from './analytics';

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
    analytics.app;
  }
}
