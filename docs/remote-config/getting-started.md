<h1>Getting started with Remote Config <em><abbr title="beta">β<abbr></em></h1>

`AngularFireRemoteConfig` dynamically imports the `firebase/remote-config` library on demand, provides convenience observables, pipes, and a promisified version of the [Firebase Remote Config SDK (`firebase.remoteConfig.RemoteConfig`)](https://firebase.google.com/docs/reference/js/firebase.remoteconfig.RemoteConfig).

### API:

```ts
class AngularFireRemoteConfigModule { }

interface ConfigTemplate {[key:string]: string|number|boolean}

type Parameter extends remoteConfig.Value {
  key: string,
  fetchTimeMillis: number
}

class AngularFireRemoteConfig {
  changes:    Observable<Parameter>;
  parameters: Observable<Parameter[]>;
  numbers:    Observable<{[key:string]: number|undefined}>  & {[key:string]: Observable<number>};
  booleans:   Observable<{[key:string]: boolean|undefined}> & {[key:string]: Observable<boolean>};
  strings:    Observable<{[key:string]: string|undefined}>  & {[key:string]: Observable<string|undefined>};
  
  // from firebase.remoteConfig() proxy:
  activate: () => Promise<boolean>;
  ensureInitialized: () => Promise<void>;
  fetch: () => Promise<void>;
  fetchAndActivate: () => Promise<boolean>;
  getAll: () => Promise<{[key:string]: remoteConfig.Value}>;
  getBoolean: (key:string) => Promise<boolean>;
  getNumber: (key:string) => Promise<number>;
  getString: (key:string) => Promise<string>;
  getValue: (key:string) => Promise<remoteConfig.Value>;
  setLogLevel: (logLevel: remoteConfig.LogLevel) => Promise<void>;
  settings: Promise<remoteConfig.Settings>;
  defaultConfig: Promise<{[key: string]: string | number | boolean}>;
  fetchTimeMillis: Promise<number>;
  lastFetchStatus: Promise<remoteConfig.FetchStatus>;
}

// Pipes for working with .changes and .parameters
filterRemote: () => MonoTypeOperatorFunction<Parameter | Parameter[]>
filterFresh: (interval: number) => MonoTypeOperatorFunction<Parameter | Parameter[]>
budget: <T>(interval: number) => MonoTypeOperatorFunction<T>

// scanToObject is for use with .changes
scanToObject: () => OperatorFunction<Parameter, {[key: string]: string|undefined}>

// mapToObject is the same behavior as scanToObject but for use with .parameters
mapToObject: () => OperatorFunction<Parameter[], {[key: string]: string|undefined}>

SETTINGS = InjectionToken<remoteConfig.Settings>;
DEFAULTS = InjectionToken<ConfigTemplate>;
```

## Configuration with Dependency Injection

### Configure Remote Config with `SETTINGS`

Using the `SETTINGS` DI Token (*default: {}*) will allow you to [configure Firebase Remote Config](https://firebase.google.com/docs/reference/js/firebase.remoteconfig.Settings.html).

### Configure default values with  `DEFAULTS`

Providing `DEFAULTS ({[key: string]: string | number | boolean})` tells `AngularFireRemoteConfig` to emit the provided defaults first. This allows you to count on Remote Config when the user is offline or in environments that the Remote Config service does not handle (i.e. Server Side Rendering).

## Putting it all together

```ts
import { AngularFireRemoteConfigModule, DEFAULTS, SETTINGS } from '@angular/fire/compat/remote-config';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireRemoteConfigModule
  ],
  providers: [
    { provide: DEFAULTS, useValue: { enableAwesome: true } },
    {
      provide: SETTINGS,
      useFactory: () => isDevMode() ? { minimumFetchIntervalMillis: 10_000 } : {}
    }
  ]
})
export class AppModule { }

...

constructor(remoteConfig: AngularFireRemoteConfig) {
  remoteConfig.changes.pipe(
    filterFresh(172_800_000), // ensure we have values from at least 48 hours ago
    first(),
    // scanToObject when used this way is similar to defaults
    // but most importantly smart-casts remote config values and adds type safety
    scanToObject({
      enableAwesome: true,
      titleBackgroundColor: 'blue',
      titleFontSize: 12
    })
  ).subscribe(…);

  // all remote config values cast as strings
  remoteConfig.strings.subscribe(...)
  remoteConfig.booleans.subscribe(...); // as booleans
  remoteConfig.numbers.subscribe(...); // as numbers

  // convenience for observing a single string
  remoteConfig.strings.titleBackgroundColor.subscribe(...);
  remoteConfig.booleans.enableAwesome.subscribe(...); // boolean
  remoteConfig.numbers.titleBackgroundColor.subscribe(...); // number

  // however those may emit more than once as the remote config cache fires and gets fresh values
  // from the server. You can filter it out of .changes for more control:
  remoteConfig.changes.pipe(
    filter(param => param.key === 'titleBackgroundColor'),
    map(param => param.asString())
    // budget at most 800ms and return the freshest value possible in that time
    // our budget pipe is similar to timeout but won't error or abort the pending server fetch
    // (it won't emit it, if the deadline is exceeded, but it will have been fetched so can use the
    // freshest values on next subscription)
    budget(800),
    last()
  ).subscribe(...)

  // just like .changes, but scanned into an array
  remoteConfig.parameters.subscribe(all => ...);

  // or make promisified firebase().remoteConfig() calls direct off AngularFireRemoteConfig
  // using our proxy
  remoteConfig.getAll().then(all => ...);
  remoteConfig.lastFetchStatus.then(status => ...);
}
```
