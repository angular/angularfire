# Configure callable functions using DI

## Calling a Cloud Functions outside of `us-central1`

Allow configuration of the Function's region by adding the `FunctionsRegionToken` to the `providers` section of your `NgModule`. The default is `us-central1`.

```ts
import { NgModule } from '@angular/core';
import { AngularFireFunctionsModule, FunctionsRegionToken } from '@angular/fire/functions';

@NgModule({
  imports: [
    ...
    AngularFireFunctionsModule,
    ...
  ],
  ...
  providers: [
   { provide: FunctionsRegionToken, useValue: 'asia-northeast1' }
  ]
})
export class AppModule {}

```

## Connect to the Cloud Functions emulator

Point callable Functions to the Cloud Function emulator by adding the  `FunctionsEmulatorOriginToken` to the `providers` section of your `NgModule`.

```ts
import { NgModule } from '@angular/core';
import { AngularFireFunctionsModule, FunctionsEmulatorOriginToken } from '@angular/fire/functions';

@NgModule({
  imports: [
    ...
    AngularFireFunctionsModule,
    ...
  ],
  ...
  providers: [
   { provide: FunctionsEmulatorOriginToken, useValue: 'http://localhost:5005' }
  ]
})
export class AppModule {}

```