import { Injectable, Injector, NgZone, OnDestroy } from '@angular/core';
import { Analytics } from './analytics';
import { Subscription } from 'rxjs';
import { VERSION, ɵisAnalyticsSupportedFactory } from '@angular/fire';
import { Auth, authState } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { setUserId } from './firebase';

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
    ɵisAnalyticsSupportedFactory.async().then(() => {
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
