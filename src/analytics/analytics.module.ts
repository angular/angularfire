import { NgModule, Optional } from '@angular/core';
import { ScreenTrackingService } from './screen-tracking.service';
import { AngularFireAnalytics } from './analytics';
import { UserTrackingService } from './user-tracking.service';

@NgModule({
  providers: [ AngularFireAnalytics ]
})
export class AngularFireAnalyticsModule {
  constructor(
    @Optional() screenTracking: ScreenTrackingService,
    @Optional() userTracking: UserTrackingService
  ) { }
}
