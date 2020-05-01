import { NgModule, Optional } from '@angular/core';
import { AngularFirePerformance } from './performance';
import { PerformanceMonitoringService } from './performance.service';

@NgModule({
  providers: [ AngularFirePerformance ]
})
export class AngularFirePerformanceModule {
  constructor(
    perf: AngularFirePerformance,
    @Optional() _: PerformanceMonitoringService
  ) {
    // call anything here to get perf loading
    perf.dataCollectionEnabled
  }
}
