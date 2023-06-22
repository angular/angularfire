import { ɵisSupportedError } from '@angular/fire';
import { isSupported } from 'firebase/messaging';

const isMessagingSupportedPromiseSymbol = '__angularfire_symbol__messagingIsSupported';
const isMessagingSupportedValueSymbol = '__angularfire_symbol__messagingIsSupportedValue';

globalThis[isMessagingSupportedPromiseSymbol] ||= isSupported().then(it =>
  globalThis[isMessagingSupportedValueSymbol] = it
).catch(() =>
  globalThis[isMessagingSupportedValueSymbol] = false
);

export const isMessagingSupportedFactory = {
  async: () => globalThis[isMessagingSupportedPromiseSymbol],
  sync: () => {
    const ret = globalThis[isMessagingSupportedValueSymbol];
    if (ret === undefined) { throw new Error(ɵisSupportedError('Messaging')); }
    return ret;
  }
};
