import { Inject, Injectable, Injector, NgZone, OnDestroy } from '@angular/core';
import { Analytics } from './analytics';
import { Subscription } from 'rxjs';
import { VERSION } from '@angular/fire';
import { Auth, authState } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { setUserId } from './firebase';
import { analyticsInstanceFactory, defaultAnalyticsInstanceFactory, isSupportedPromiseSymbol, PROVIDED_ANALYTICS_INSTANCE_FACTORIES } from './analytics.module';
import { FirebaseApp } from '@angular/fire/app';

@Injectable()
export class UserTrackingService implements OnDestroy {

  public readonly initialized: Promise<void>;
  private readonly disposables: Array<Subscription> = [];

  constructor(
    auth: Auth,
    zone: NgZone,
    @Inject(PROVIDED_ANALYTICS_INSTANCE_FACTORIES) analyticsInstanceFactories: Array<(injector: Injector) => Analytics>,
    injector: Injector,
    firebaseApp: FirebaseApp,
  ) {
    registerVersion('angularfire', VERSION.full, 'user-tracking');
    // Analytics is not ready to be injected yet, as the APP_INITIALIZER hasn't evulated yet, do this the hard way
    const analyticsInstance: Promise<Analytics|null> = globalThis[isSupportedPromiseSymbol].then((isSupported: boolean) => {
      const analyticsInstances = analyticsInstanceFactories.map(fn => analyticsInstanceFactory(fn)(zone, isSupported, injector));
      return defaultAnalyticsInstanceFactory(isSupported, analyticsInstances, firebaseApp);
    });
    let resolveInitialized: () => void;
    this.initialized = zone.runOutsideAngular(() => new Promise(resolve => { resolveInitialized = resolve; }));
    this.disposables = [
      // TODO add credential tracking back in
      authState(auth).subscribe(user => {
        analyticsInstance.then(analytics => analytics && setUserId(analytics, user?.uid));
        resolveInitialized();
      }),
    ];
  }

  ngOnDestroy() {
    this.disposables.forEach(it => it.unsubscribe());
  }
}
