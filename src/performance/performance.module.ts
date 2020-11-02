import { NgModule, Optional } from '@angular/core';
import { ɵapplyMixins } from '@angular/fire';
import { proxyPolyfillCompat } from './base';
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
    ɵapplyMixins(AngularFirePerformance, [proxyPolyfillCompat]);

    // call anything here to get perf loading
    // tslint:disable-next-line:no-unused-expression
    perf.dataCollectionEnabled.then(() => {});
  }
}
