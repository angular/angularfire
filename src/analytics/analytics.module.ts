import { NgModule } from '@angular/core';
import { AngularFireAnalytics } from './analytics';

@NgModule({
  providers: [ AngularFireAnalytics ]
})
export class AngularFireAnalyticsModule {
  constructor(_: AngularFireAnalytics) {
    // DI inject Analytics here for the automatic data collection
  } 
}
