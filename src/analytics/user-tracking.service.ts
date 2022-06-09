import { Injectable, Injector, NgZone, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { VERSION } from '@angular/fire';
import { Auth, authState } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';

import { Analytics } from './analytics';
import { setUserId, isSupported } from './firebase';

@Injectable()
export class UserTrackingService implements OnDestroy {

  public readonly initialized: Promise<void>;
  private disposables: Array<Subscription> = [];

  constructor(
    auth: Auth,
    zone: NgZone,
    injector: Injector,
  ) {
    registerVersion('angularfire', VERSION.full, 'user-tracking');
    let resolveInitialized: () => void;
    this.initialized = zone.runOutsideAngular(() => new Promise(resolve => { resolveInitialized = resolve; }));
    // The APP_INITIALIZER that is making isSupported() sync for the sake of convenient DI
    // may not be done when services are initialized. Guard the functionality by first ensuring
    // that the (global) promise has resolved, then get Analytics from the injector.
    isSupported().then(() => {
      const analytics = injector.get(Analytics);
      if (analytics) {
        this.disposables = [
          // TODO add credential tracking back in
          authState(auth).subscribe(user => {
            setUserId(analytics, user?.uid);
            resolveInitialized();
          }),
        ];
      } else {
        resolveInitialized();
      }
    });
  }

  ngOnDestroy() {
    this.disposables.forEach(it => it.unsubscribe());
  }
}
