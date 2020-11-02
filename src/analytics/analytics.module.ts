import { NgModule, Optional } from '@angular/core';
import { ScreenTrackingService, UserTrackingService } from './analytics.service';
import { AngularFireAnalytics } from './analytics';
import { ɵapplyMixins } from '@angular/fire';
import { proxyPolyfillCompat } from './base';

@NgModule({
  providers: [ AngularFireAnalytics ]
})
export class AngularFireAnalyticsModule {
  constructor(
    analytics: AngularFireAnalytics,
    @Optional() screenTracking: ScreenTrackingService,
    @Optional() userTracking: UserTrackingService
  ) {
    ɵapplyMixins(AngularFireAnalytics, [proxyPolyfillCompat]);

    // calling anything on analytics will eagerly load the SDK
    // tslint:disable-next-line:no-unused-expression
    analytics.app.then(() => {});
  }
}
