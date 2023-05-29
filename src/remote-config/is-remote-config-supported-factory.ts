import { isSupported } from '@firebase/remote-config';
import { ɵisSupportedError } from '@angular/fire';

const isRemoteConfigSupportedValueSymbol = '__angularfire_symbol__remoteConfigIsSupportedValue';
const isRemoteConfigSupportedPromiseSymbol = '__angularfire_symbol__remoteConfigIsSupported';

globalThis[isRemoteConfigSupportedPromiseSymbol] ||= isSupported().then(it =>
  globalThis[isRemoteConfigSupportedValueSymbol] = it
).catch(() =>
  globalThis[isRemoteConfigSupportedValueSymbol] = false
);

export const isRemoteConfigSupportedFactory = {
  async: () => globalThis[isRemoteConfigSupportedPromiseSymbol],
  sync: () => {
    const ret = globalThis[isRemoteConfigSupportedValueSymbol];
    if (ret === undefined) { throw new Error(ɵisSupportedError('RemoteConfig')); }
    return ret;
  }
};
