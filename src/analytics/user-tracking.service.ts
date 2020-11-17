import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AngularFireAnalytics } from 'dist/packages-dist/analytics/analytics';
import { AngularFireAuth } from 'dist/packages-dist/auth/auth';
import { Subscription } from 'rxjs';
import { pairwise, tap } from 'rxjs/operators';

@Injectable()
export class UserTrackingService implements OnDestroy {

  initialized: Promise<void>;
  private disposable: Subscription | undefined;

  // TODO a user properties injector
  constructor(
    analytics: AngularFireAnalytics,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    auth: AngularFireAuth,
  ) {

    this.initialized = new Promise(resolve => {
      if (!isPlatformServer(platformId)) {
        this.disposable = auth.user.pipe(
            tap(user => {
                // TODO pairwise, null => !null track login
                analytics.setUserId(user?.uid);
                resolve();
            }),
            pairwise(),
            tap(([prev, current]) => {
                if (!prev && current) {
                    // TODO how do I differentiate from signup? current.metadata.creationTime
                    if (current.metadata.creationTime) {
                        analytics.logEvent('login', { method: current.providerId });
                    } else {
                        analytics.logEvent('signup', { method: current.providerId });
                    }
                }
            })
        ).subscribe();
      } else {
        resolve();
      }
    });

  }

  ngOnDestroy() {
    if (this.disposable) {
      this.disposable.unsubscribe();
    }
  }
}
