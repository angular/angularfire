import { NgModule, Optional, ApplicationRef, NgZone } from '@angular/core';
import { AngularFirePerformance, AUTOMATICALLY_TRACE_CORE_NG_METRICS, INSTRUMENTATION_ENABLED, DATA_COLLECTION_ENABLED } from './performance';
import { FirebaseApp } from '@angular/fire';

import 'firebase/performance';

const AngularFirePerformanceProvider = {
  provide: AngularFirePerformance,
  deps: [
      FirebaseApp,
      [new Optional(), AUTOMATICALLY_TRACE_CORE_NG_METRICS],
      [new Optional(), INSTRUMENTATION_ENABLED],
      [new Optional(), DATA_COLLECTION_ENABLED],
      ApplicationRef,
      NgZone
  ]
};

@NgModule({
  providers: [ AngularFirePerformanceProvider ]
})
export class AngularFirePerformanceModule {
  constructor(_: AngularFirePerformance) {
    // DI inject AFP here for the automatic data collection
  } 
}
