import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AngularFireAnalytics } from './analytics';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { setUserId, logEvent } from 'firebase/analytics';
import { getAdditionalUserInfo } from 'firebase/auth';

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
          analytics.analytics$.pipe(
            switchMap(analytics => {
              return auth.authState.pipe(
                map(user => ({ user, analytics }))
              );
            })
          ).subscribe(({ user, analytics }) => {
            setUserId(analytics, user?.uid);
            resolveInitialized();
          }),

          analytics.analytics$.pipe(
            switchMap(analytics => {
              return auth.credential.pipe(
                map(credential => ({ credential, analytics }))
              );
            })
          ).subscribe(({ credential, analytics }) => {
            if (credential) {
              const additionalUserInfo = getAdditionalUserInfo(credential);
              const method = credential.user.isAnonymous ? 'anonymous' : additionalUserInfo.providerId;
              if (additionalUserInfo.isNewUser) {
                logEvent(analytics, 'sign_up', { method });
              }
              logEvent(analytics, 'login', { method });
            }
          }),
      ];
    } else {
      this.initialized = Promise.resolve();
    }

  }

  ngOnDestroy() {
    this.disposables.forEach(it => it.unsubscribe());
  }
}
