import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AngularFireAnalytics } from './analytics';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Injectable()
export class UserTrackingService implements OnDestroy {

  initialized: Promise<void>;
  private disposables: Array<Subscription> = [];

  // TODO a user properties injector
  constructor(
    analytics: AngularFireAnalytics,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    auth: AngularFireAuth,
    zone: NgZone,
  ) {

    if (!isPlatformServer(platformId)) {
      let resolveInitialized;
      this.initialized = zone.runOutsideAngular(() => new Promise(resolve => resolveInitialized = resolve));
      this.disposables = [
          auth.authState.subscribe(user => {
            analytics.setUserId(user?.uid);
            resolveInitialized();
          }),
          auth.credential.subscribe(credential => {
            if (credential) {
              const method = credential.user.isAnonymous ? 'anonymous' : credential.additionalUserInfo.providerId;
              if (credential.additionalUserInfo.isNewUser) {
                analytics.logEvent('sign_up', { method });
              }
              analytics.logEvent('login', { method });
            }
          })
      ];
    } else {
      this.initialized = Promise.resolve();
    }

  }

  ngOnDestroy() {
    this.disposables.forEach(it => it.unsubscribe());
  }
}
