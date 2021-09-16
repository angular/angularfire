import { isDevMode } from '@angular/core';

export function ɵcacheInstance<T>(cacheKey: any, moduleName: string, appName: string, fn: () => T, deps: any): T {
  const [, instance, cachedDeps] = globalThis.ɵAngularfireInstanceCache.find((it: any) => it[0] === cacheKey) || [];
  if (instance) {
    if (!matchDep(deps, cachedDeps)) {
      log('error', `${moduleName} was already initialized on the ${appName} Firebase App with different settings.${IS_HMR ? ' You may need to reload as Firebase is not HMR aware.' : ''}`);
      log('warn', {is: deps, was: cachedDeps});
    }
    return instance;
  } else {
    const newInstance = fn();
    globalThis.ɵAngularfireInstanceCache.push([cacheKey, newInstance, deps]);
    return newInstance;
  }
}

function matchDep(a: any, b: any) {
  try {
    return a.toString() === b.toString();
  } catch (_) {
    return a === b;
  }
}

const IS_HMR = !!(module as any).hot;

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

globalThis.ɵAngularfireInstanceCache ||= [];
