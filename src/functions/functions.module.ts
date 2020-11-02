import { NgModule } from '@angular/core';
import { ɵapplyMixins } from '@angular/fire';
import { proxyPolyfillCompat } from './base';
import { AngularFireFunctions } from './functions';

@NgModule({
  providers: [ AngularFireFunctions ]
})
export class AngularFireFunctionsModule {
  constructor() {
    ɵapplyMixins(AngularFireFunctions, [proxyPolyfillCompat]);
  }
}
