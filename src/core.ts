import { Version } from '@angular/core';
import { ComponentContainer } from '@firebase/component';
import { FirebaseApp, getApps } from 'firebase/app';
import type { AppCheck } from 'firebase/app-check';

export const VERSION = new Version('ANGULARFIRE2_VERSION');

export const ɵisSupportedError = (module: string) =>
  `The APP_INITIALIZER that is "making" isSupported() sync for the sake of convenient DI has not resolved in this
context. Rather than injecting ${module} in the constructor, first ensure that ${module} is supported by calling
\`await isSupported()\`, then retrieve the instance from the injector manually \`injector.get(${module})\`.`;

// TODO is there a better way to get at the internal types?
interface FirebaseAppWithContainer extends FirebaseApp {
  container: ComponentContainer;
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

export const ɵgetAllInstancesOf = <T= unknown>(identifier: string, app?: FirebaseApp): T[] => {
  const apps = app ? [app] : getApps();
  const instances: any[] = [];
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ɵAppCheckInstances extends Array<AppCheck> {}

export class ɵAppCheckInstances {
  constructor() {
    return ɵgetAllInstancesOf<AppCheck>(ɵAPP_CHECK_PROVIDER_NAME);
  }
}

export const ɵAPP_CHECK_PROVIDER_NAME = 'app-check';
