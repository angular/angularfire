import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { AngularFireStorageReference, createStorageRef } from './ref';
import { Observable, of } from 'rxjs';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfetchInstance,
  ɵfirebaseAppFactory,
  ɵkeepUnstableUntilFirstFactory,
  ɵlazySDKProxy,
  ɵapplyMixins,
  ɵPromiseProxy
} from '@angular/fire';
import { UploadMetadata } from './interfaces';
import firebase from 'firebase/app';
import { map, observeOn, switchMap } from 'rxjs/operators';
import { AngularFireUploadTask } from './task';
import { proxyPolyfillCompat } from './base';

export const BUCKET = new InjectionToken<string>('angularfire2.storageBucket');
export const MAX_UPLOAD_RETRY_TIME = new InjectionToken<number>('angularfire2.storage.maxUploadRetryTime');
export const MAX_OPERATION_RETRY_TIME = new InjectionToken<number>('angularfire2.storage.maxOperationRetryTime');

export interface AngularFireStorage extends Omit<ɵPromiseProxy<firebase.storage.Storage>, 'ref' | 'refFromURL'> {}

/**
 * AngularFireStorage Service
 *
 * This service is the main entry point for this feature module. It provides
 * an API for uploading and downloading binary files from Cloud Storage for
 * Firebase.
 */
@Injectable({
  providedIn: 'any'
})
export class AngularFireStorage {

  public readonly keepUnstableUntilFirst: <T>(obs: Observable<T>) => Observable<T>;
  public readonly schedulers: ɵAngularFireSchedulers;

  public readonly ref: (path: string) => AngularFireStorageReference;
  public readonly refFromURL: (url: string) => AngularFireStorageReference;
  public readonly upload: (path: string, data: any, metadata?: UploadMetadata) => AngularFireUploadTask;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
    @Optional() @Inject(BUCKET) storageBucket: string | null,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(MAX_UPLOAD_RETRY_TIME) maxUploadRetryTime: number | any,
    @Optional() @Inject(MAX_OPERATION_RETRY_TIME) maxOperationRetryTime: number | any,
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers);

    const storage = of(undefined).pipe(
      observeOn(this.schedulers.outsideAngular),
      switchMap(() => zone.runOutsideAngular(() => import('firebase/storage'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app =>
        ɵfetchInstance(`${app.name}.storage.${storageBucket}`, 'AngularFireStorage', app, () => {
          const storage = zone.runOutsideAngular(() => app.storage(storageBucket || undefined));
          if (maxUploadRetryTime) {
            storage.setMaxUploadRetryTime(maxUploadRetryTime);
          }
          if (maxOperationRetryTime) {
            storage.setMaxOperationRetryTime(maxOperationRetryTime);
          }
          return storage;
        }, [maxUploadRetryTime, maxOperationRetryTime])
      )
    );

    this.ref = (path) => createStorageRef(storage.pipe(map(it => it.ref(path))), this.schedulers, this.keepUnstableUntilFirst);

    this.refFromURL = (path) =>
      createStorageRef(storage.pipe(map(it => it.refFromURL(path))), this.schedulers, this.keepUnstableUntilFirst);

    this.upload = (path, data, metadata?) => {
      const storageRef = storage.pipe(map(it => it.ref(path)));
      const ref = createStorageRef(storageRef, this.schedulers, this.keepUnstableUntilFirst);
      return ref.put(data, metadata);
    };

    return ɵlazySDKProxy(this, storage, zone);

  }

}

ɵapplyMixins(AngularFireStorage, [proxyPolyfillCompat]);
