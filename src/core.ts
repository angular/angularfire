import { isDevMode, Version } from '@angular/core';

export const VERSION = new Version('ANGULARFIRE2_VERSION');

const IS_HMR = !!(module as any).hot;

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

globalThis.ɵAngularfireInstanceCache ||= new Map();

export function ɵcacheInstance<T>(cacheKey: any, moduleName: string, appName: string, fn: () => T, deps: any): T {
  const [instance, cachedDeps] = globalThis.ɵAngularfireInstanceCache.get(cacheKey) || [];
  if (instance) {
    if (deps !== cachedDeps) {
      log('error', `${moduleName} was already initialized on the ${appName} Firebase App with different settings.${IS_HMR ? ' You may need to reload as Firebase is not HMR aware.' : ''}`);
    }
    return instance;
  } else {
    const newInstance = fn();
    globalThis.ɵAngularfireInstanceCache.set(cacheKey, [newInstance, deps]);
    return newInstance;
  }
}

export function ɵsmartCacheInstance<T>(moduleName: string, fn: () => T): T {
  const cached = ɵfetchCachedInstanceByDep<T>(fn);
  if (cached) {
    return cached as T;
  } else {
    const instance = fn();
    globalThis.ɵAngularfireInstanceCache.set([moduleName, (instance as any).name].join('.'), [instance, fn]);
    return instance;
  }
}

function matchDep(a: any, b: any) {
  try {
    return a.toString() === b.toString();
  } catch (_) {
    return a === b;
  }
}

export function ɵfetchCachedInstanceByDep<T>(depToMatch: any) {
  const match = Array.from(globalThis.ɵAngularfireInstanceCache.values()).
    filter(it => it instanceof Array).
    find(([, dep]) => matchDep(dep, depToMatch));
  return match && match[0];
}

export function ɵfetchCachedInstance(cacheKey: any) {
  const [instance] = globalThis.ɵAngularfireInstanceCache.get(cacheKey) || [];
  return instance;
}

export function ɵfetchAllCachedInstances(prefix: any) {
  return Array.from(globalThis.ɵAngularfireInstanceCache.keys()).
    filter((k: string) => k.startsWith(prefix)).
    map(k => globalThis.ɵAngularfireInstanceCache.get(k)[0]);
}
