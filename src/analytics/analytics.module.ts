import { NgModule, Optional } from '@angular/core';
import { UserTrackingService, ScreenTrackingService } from './analytics.service';
import { AngularFireAnalytics } from './analytics';

@NgModule({
  providers: [ AngularFireAnalytics ]
})
export class AngularFireAnalyticsModule {
  constructor(
    @Optional() screenTracking: ScreenTrackingService,
    @Optional() userTracking: UserTrackingService
  ) { }
}
