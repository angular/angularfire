import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Analytics } from './analytics';
import { Subscription } from 'rxjs';
import { VERSION } from '@angular/fire';
import { Auth, authState } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { setUserId } from './firebase';

@Injectable()
export class UserTrackingService implements OnDestroy {

  public readonly initialized: Promise<void>;
  private readonly disposables: Array<Subscription> = [];

  constructor(
    analytics: Analytics,
    auth: Auth,
    zone: NgZone,
  ) {
    registerVersion('angularfire', VERSION.full, 'user-tracking');
    if (analytics) {
      let resolveInitialized: () => void;
      this.initialized = zone.runOutsideAngular(() => new Promise(resolve => { resolveInitialized = resolve; }));
      this.disposables = [
        // TODO add credential tracking back in
        authState(auth).subscribe(user => {
          resolveInitialized();
          setUserId(analytics, user?.uid);
        }),
      ];
    } else {
      this.initialized = Promise.reject();
    }
  }

  ngOnDestroy() {
    this.disposables.forEach(it => it.unsubscribe());
  }
}
