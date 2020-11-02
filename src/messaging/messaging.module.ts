import { NgModule } from '@angular/core';
import { ɵapplyMixins } from '@angular/fire';
import { proxyPolyfillCompat } from './base';
import { AngularFireMessaging } from './messaging';

@NgModule({
  providers: [ AngularFireMessaging ]
})
export class AngularFireMessagingModule {
  constructor() {
    ɵapplyMixins(AngularFireMessaging, [proxyPolyfillCompat]);
  }
}
