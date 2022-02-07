import { Version } from '@angular/core';
import { FirebaseApp, getApps } from 'firebase/app';
import { ComponentContainer } from '@firebase/component';
import { isSupported as isRemoteConfigSupported } from 'firebase/remote-config';
import { isSupported as isMessagingSupported } from 'firebase/messaging';
import { isSupported as isAnalyticsSupported } from 'firebase/analytics';

export const VERSION = new Version('ANGULARFIRE2_VERSION');

const isAnalyticsSupportedValueSymbol = '__angularfire_symbol__analyticsIsSupportedValue';
const isAnalyticsSupportedPromiseSymbol = '__angularfire_symbol__analyticsIsSupported';
const isRemoteConfigSupportedValueSymbol = '__angularfire_symbol__remoteConfigIsSupportedValue';
const isRemoteConfigSupportedPromiseSymbol = '__angularfire_symbol__remoteConfigIsSupported';
const isMessagingSupportedValueSymbol = '__angularfire_symbol__messagingIsSupportedValue';
const isMessagingSupportedPromiseSymbol = '__angularfire_symbol__messagingIsSupported';

globalThis[isAnalyticsSupportedPromiseSymbol] ||= isAnalyticsSupported().then(it =>
  globalThis[isAnalyticsSupportedValueSymbol] = it
).catch(() =>
  globalThis[isAnalyticsSupportedValueSymbol] = false
);

globalThis[isMessagingSupportedPromiseSymbol] ||= isMessagingSupported().then(it =>
  globalThis[isMessagingSupportedValueSymbol] = it
).catch(() =>
  globalThis[isMessagingSupportedValueSymbol] = false
);

globalThis[isRemoteConfigSupportedPromiseSymbol] ||= isRemoteConfigSupported().then(it =>
  globalThis[isRemoteConfigSupportedValueSymbol] = it
).catch(() =>
  globalThis[isRemoteConfigSupportedValueSymbol] = false
);

const isSupportedError = (module: string) =>
  `The APP_INITIALIZER that is "making" isSupported() sync for the sake of convenient DI has not resolved in this
context. Rather than injecting ${module} in the constructor, first ensure that ${module} is supported by calling
\`await isSupported()\`, then retrieve the instance from the injector manually \`injector.get(${module})\`.`;

export const ɵisMessagingSupportedFactory = {
  async: () => globalThis[isMessagingSupportedPromiseSymbol],
  sync: () => {
    const ret = globalThis[isMessagingSupportedValueSymbol];
    if (ret === undefined) { throw new Error(isSupportedError('Messaging')); }
    return ret;
  }
};

export const ɵisRemoteConfigSupportedFactory = {
  async: () => globalThis[isRemoteConfigSupportedPromiseSymbol],
  sync: () => {
    const ret = globalThis[isRemoteConfigSupportedValueSymbol];
    if (ret === undefined) { throw new Error(isSupportedError('RemoteConfig')); }
    return ret;
  }
};

export const ɵisAnalyticsSupportedFactory = {
  async: () => globalThis[isAnalyticsSupportedPromiseSymbol],
  sync: () => {
    const ret = globalThis[isAnalyticsSupportedValueSymbol];
    if (ret === undefined) { throw new Error(isSupportedError('Analytics')); }
    return ret;
  }
};

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
