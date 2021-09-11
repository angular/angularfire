import { NgModule, Optional } from '@angular/core';
import { AngularFirePerformance } from './performance';
import { PerformanceMonitoringService } from './performance.service';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';

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
    // tslint:disable-next-line:no-unused-expression
    perf.dataCollectionEnabled.then(() => {});
  }
}
