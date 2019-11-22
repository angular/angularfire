# Getting started with Remote Config

### Something, something

TBD

### Putting it all together

```ts
@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireRemoteConfigModule
  ],
  providers: [
    { provide: DEFAULT_CONFIG, useValue: { enableAwesome: true } },
    {
      provide: REMOTE_CONFIG_SETTINGS,
      useFactory: () => isDevMode ? { minimumFetchIntervalMillis: 1 } : {}
    }
  ]
})
export class AppModule { }
```

```ts
constructor(remoteConfig: AngularFireRemoteConfig) {
    remoteConfig.changes.subscribe(changes => …);
}
```