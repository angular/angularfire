import { isDevMode, NgZone, Version } from '@angular/core';
import { FirebaseApp, getApp, getApps } from 'firebase/app';
import { ComponentContainer } from '@firebase/component';

export const VERSION = new Version('ANGULARFIRE2_VERSION');

// TODO is there a better way to get at the internal types?
interface FirebaseAppWithContainer extends FirebaseApp {
  container: ComponentContainer;
}

const IS_HMR = !!(module as any).hot;

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

export function ɵcacheInstance<T>(cacheKey: any, moduleName: string, appName: string, fn: () => T, deps: any): T {
  const [, instance, cachedDeps] = globalThis.ɵAngularfireInstanceCache.find((it: any) => it[0] === cacheKey) || [];
  if (instance) {
    if (deps !== cachedDeps) {
      log('error', `${moduleName} was already initialized on the ${appName} Firebase App with different settings.${IS_HMR ? ' You may need to reload as Firebase is not HMR aware.' : ''}`);
    }
    return instance;
  } else {
    const newInstance = fn();
    globalThis.ɵAngularfireInstanceCache.push([cacheKey, newInstance, deps]);
    return newInstance;
  }
}

globalThis.ɵAngularfireInstanceCache ||= [];

export function ɵmemoizeInstance<T>(fn: () => T, zone: NgZone): T {
  const [, instance] = globalThis.ɵAngularfireInstanceCache.find((it: any) => matchDep(it[0], fn)) || [];
  if (instance) {
    return instance as T;
  } else {
    // TODO catch and add HMR warning
    const instance = zone.runOutsideAngular(() => fn());
    globalThis.ɵAngularfireInstanceCache.push([fn, instance]);
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

export function ɵgetDefaultInstanceOf<T= unknown>(identifier: string): T|undefined  {
  const defaultApp = getApp();
  return ɵgetAllInstancesOf<T>(identifier, defaultApp)[0];
}

export const ɵgetAllInstancesOf = <T= unknown>(identifier: string, app?: FirebaseApp): Array<T> => {
  const apps = app ? [app] : getApps();
  const instances: Array<any> = [];
  apps.forEach((app: FirebaseAppWithContainer) => {
    const provider: any = app.container.getProvider(identifier as any);
    provider.instances.forEach((instance: any) => {
      if (!instances.includes(instance)) {
        instances.push(instance);
      }
    });
  });
  return instances;
};
