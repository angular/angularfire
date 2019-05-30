import { NgModule } from '@angular/core';
import { AngularFirePerformance } from './performance';

@NgModule({
  providers: [ AngularFirePerformance ]
})
export class AngularFirePerformanceModule {
  constructor(_: AngularFirePerformance) {
    // DI inject AFP here for the automatic data collection
  } 
}
