import { ComponentFactoryResolver, Injectable, NgZone, OnDestroy, Optional } from '@angular/core';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AngularFireAnalytics } from './analytics';
import { Title } from '@angular/platform-browser';
import { UserTrackingService } from './user-tracking.service';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';
import { ɵscreenViewEvent } from '@angular/fire/analytics';

const SCREEN_VIEW_EVENT = 'screen_view';

@Injectable()
export class ScreenTrackingService implements OnDestroy {

  private disposable: Subscription | undefined;

  constructor(
    analytics: AngularFireAnalytics,
    @Optional() router: Router,
    @Optional() title: Title,
    componentFactoryResolver: ComponentFactoryResolver,
    zone: NgZone,
    @Optional() userTrackingService: UserTrackingService,
  ) {
    firebase.registerVersion('angularfire', VERSION.full, 'compat-screen-tracking');
    if (!router || !analytics) { return this; }
    zone.runOutsideAngular(() => {
      this.disposable = ɵscreenViewEvent(router, title, componentFactoryResolver).pipe(
          switchMap(async params => {
            if (userTrackingService) {
              await userTrackingService.initialized;
            }
            return await analytics.logEvent(SCREEN_VIEW_EVENT, params);
          })
      ).subscribe();
    });
  }

  ngOnDestroy() {
    if (this.disposable) {
      this.disposable.unsubscribe();
    }
  }

}
