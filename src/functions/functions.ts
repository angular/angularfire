import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { FirebaseOptions, FirebaseAppConfig } from 'angularfire2';

import { FirebaseFunctions, FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory, runOutsideAngular } from 'angularfire2';

@Injectable()
export class AngularFireFunctions {

  /**
   * Firebase Functions instance
   */
  public readonly functions: Observable<FirebaseFunctions>;

  public httpsCallable: <T=any, R=any>(name:string) => (data: T) => Observable<T>;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {

    // @ts-ignore
    const requireFunctions = from(import('firebase/functions'));

    this.functions = requireFunctions.pipe(
      map(() => _firebaseAppFactory(options, nameOrConfig)),
      map(app => app.functions()),
      runOutsideAngular(zone)
    );

    this.httpsCallable = name => data => this.functions.pipe(
      map(functions => functions.httpsCallable(name)),
      switchMap(callable => callable(data)),
      map(response => response.data),
      runOutsideAngular(zone)
    )

  }

}
