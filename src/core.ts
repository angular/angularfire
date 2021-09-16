import { isDevMode, NgZone, Version } from '@angular/core';
import { FirebaseApp, getApps } from 'firebase/app';
import { ComponentContainer } from '@firebase/component';

export const VERSION = new Version('ANGULARFIRE2_VERSION');

// TODO is there a better way to get at the internal types?
interface FirebaseAppWithContainer extends FirebaseApp {
  container: ComponentContainer;
}

const LOCALHOSTS = ['localhost', '0.0.0.0', '127.0.0.1'];

// HACK HACK HACK
// AppCheck stuff, here so we can get a jump on it. It's too late in the evaluation
// if we do this in the app-check module. globalThis.ngDevMode allows me to test if
// Angular is in DevMode before Angular initializes.
// Only do this in the browser, for Node we have the admin sdk
if ((
  typeof process === 'undefined' || !process.versions?.node
) && (
  globalThis.ngDevMode || typeof window !== 'undefined' && LOCALHOSTS.includes(window.location.hostname)
)) {
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN ??= true;
}

export function ɵgetDefaultInstanceOf<T= unknown>(identifier: string, provided: T[]|undefined, defaultApp: FirebaseApp): T|undefined  {
  if (provided) {
    // Was provide* only called once? If so grab that
    if (provided.length === 1) { return provided[0]; }
    const providedUsingDefaultApp = provided.filter((it: any) => it.app === defaultApp);
    // Was provide* only called once, using the default app? If so use that
    if (providedUsingDefaultApp.length === 1) { return providedUsingDefaultApp[0]; }
  }
  // Grab the default instance from the defaultApp
  const defaultAppWithContainer: FirebaseAppWithContainer = defaultApp as any;
  const provider = defaultAppWithContainer.container.getProvider(identifier as never);
  return provider.getImmediate({ optional: true });
}

export const ɵgetAllInstancesOf = <T= unknown>(identifier: string, app?: FirebaseApp): Array<T> => {
  const apps = app ? [app] : getApps();
  const instances: Array<any> = [];
  apps.forEach((app: FirebaseAppWithContainer) => {
    const provider: any = app.container.getProvider(identifier as never);
    provider.instances.forEach((instance: any) => {
      if (!instances.includes(instance)) {
        instances.push(instance);
      }
    });
  });
  return instances;
};
