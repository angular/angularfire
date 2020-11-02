import { NgModule } from '@angular/core';
import { ɵapplyMixins } from '@angular/fire';
import { AngularFireAuth } from './auth';
import { proxyPolyfillCompat } from './base';

@NgModule({
  providers: [ AngularFireAuth ]
})
export class AngularFireAuthModule {
  constructor() {
    ɵapplyMixins(AngularFireAuth, [proxyPolyfillCompat]);
  }
}
