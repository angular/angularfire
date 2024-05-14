import { NgModule, Optional } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
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
    firebase.registerVersion('angularfire', VERSION.full, 'perf-compat');
    // call anything here to get perf loading
    perf.dataCollectionEnabled.then(() => undefined);
  }
}
