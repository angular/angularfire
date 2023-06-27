import { Version } from '@angular/core';
import { FirebaseApp, getApps } from 'firebase/app';
import { ComponentContainer } from '@firebase/component';
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

// tslint:disable-next-line:no-empty-interface
export interface AppCheckInstances extends Array<AppCheck> {}

// tslint:disable-next-line:class-name
export class AppCheckInstances {
  constructor() {
    return ɵgetAllInstancesOf<AppCheck>(ɵAPP_CHECK_PROVIDER_NAME);
  }
}

// tslint:disable-next-line:variable-name
export const ɵAPP_CHECK_PROVIDER_NAME = 'app-check';
