import { NgModule } from '@angular/core';
import { ɵapplyMixins } from '@angular/fire';
import { proxyPolyfillCompat } from './base';
import { AngularFireRemoteConfig } from './remote-config';

@NgModule({
    providers: [AngularFireRemoteConfig]
})
export class AngularFireRemoteConfigModule {
    constructor() {
        ɵapplyMixins(AngularFireRemoteConfig, [proxyPolyfillCompat]);
    }
}
