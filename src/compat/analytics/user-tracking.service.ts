import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { VERSION } from '@angular/fire';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { Subscription } from 'rxjs';
import { AngularFireAnalytics } from './analytics';

@Injectable()
export class UserTrackingService implements OnDestroy {

  initialized: Promise<void>;
  private disposables: Subscription[] = [];

  // TODO a user properties injector
  constructor(
    analytics: AngularFireAnalytics,
    // eslint-disable-next-line @typescript-eslint/ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    auth: AngularFireAuth,
    zone: NgZone,
  ) {
    firebase.registerVersion('angularfire', VERSION.full, 'compat-user-tracking');
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
