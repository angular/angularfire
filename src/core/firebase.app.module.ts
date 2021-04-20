import { isDevMode } from '@angular/core';
import { FirebaseApp as FirebaseCompatApp } from '@angular/fire/compat';

export const ɵlogAuthEmulatorError = () => {
  // TODO sort this out, https://github.com/angular/angularfire/issues/2656
  log('warn', 'You may need to import \'firebase/auth\' manually in your component rather than rely on AngularFireAuth\'s dynamic import, when using the emulator suite https://github.com/angular/angularfire/issues/2656');
};

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

globalThis.ɵAngularfireInstanceCache ||= new Map();

export function ɵfetchInstance<T>(cacheKey: any, moduleName: string, app: FirebaseCompatApp, fn: () => T, args: any[]): T {
  const [instance, ...cachedArgs] = globalThis.ɵAngularfireInstanceCache.get(cacheKey) || [];
  if (instance) {
    try {
      if (args.some((arg, i) => {
        const cachedArg = cachedArgs[i];
        if (arg && typeof arg === 'object') {
          return JSON.stringify(arg) !== JSON.stringify(cachedArg);
        } else {
          return arg !== cachedArg;
        }
      })) {
        const hmr = !!(module as any).hot;
        log('error', `${moduleName} was already initialized on the ${app.name} Firebase App instance with different settings.${hmr ? ' You may need to reload as Firebase is not HMR aware.' : ''}`);
      }
    } catch (e) { }
    return instance;
  } else {
    const newInstance = fn();
    globalThis.ɵAngularfireInstanceCache.set(cacheKey, [newInstance, ...args]);
    return newInstance;
  }
}
