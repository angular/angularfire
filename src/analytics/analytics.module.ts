import { NgModule, Optional } from '@angular/core';
import { UserTrackingService, ScreenTrackingService } from './analytics.service';
import { AngularFireAnalytics } from './analytics';

@NgModule()
export class AngularFireAnalyticsModule {
  constructor(
    analytics: AngularFireAnalytics,
    @Optional() screenTracking: ScreenTrackingService,
    @Optional() userTracking: UserTrackingService
  ) { }
}
