import { ɵisSupportedError } from '@angular/fire';
import { isSupported } from '@firebase/analytics';

const isAnalyticsSupportedValueSymbol = '__angularfire_symbol__analyticsIsSupportedValue';
const isAnalyticsSupportedPromiseSymbol = '__angularfire_symbol__analyticsIsSupported';

globalThis[isAnalyticsSupportedPromiseSymbol] ||= isSupported().then(it =>
  globalThis[isAnalyticsSupportedValueSymbol] = it
).catch(() =>
  globalThis[isAnalyticsSupportedValueSymbol] = false
);
export const isAnalyticsSupportedFactory = {
  async: () => globalThis[isAnalyticsSupportedPromiseSymbol],
  sync: () => {
    const ret = globalThis[isAnalyticsSupportedValueSymbol];
    if (ret === undefined) { throw new Error(ɵisSupportedError('Analytics')); }
    return ret;
  }
};
