import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { AngularFireAuth } from '@angular/fire/auth';
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
                analytics.setUserId(user?.uid);
                resolve();
            }),
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
