import { NgModule } from '@angular/core';
import { AngularFirePerformance } from './performance';

import 'firebase/perf';

@NgModule({
  providers: [ AngularFirePerformance ]
})
export class AngularFirePerformanceModule { }
