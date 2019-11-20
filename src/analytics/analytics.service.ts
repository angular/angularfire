import { Injectable, Inject, Optional, NgZone, OnDestroy, InjectionToken } from '@angular/core';
import { Subscription, from, Observable, empty } from 'rxjs';
import { filter, withLatestFrom, switchMap, map, tap } from 'rxjs/operators';
import { Router, NavigationEnd, ActivationEnd } from '@angular/router';
import { runOutsideAngular, _lazySDKProxy, _firebaseAppFactory } from '@angular/fire';
import { AngularFireAnalytics } from './analytics';
import { User } from 'firebase/app';

export const AUTOMATICALLY_SET_CURRENT_SCREEN = new InjectionToken<boolean>('angularfire2.analytics.setCurrentScreen');
export const AUTOMATICALLY_LOG_SCREEN_VIEWS = new InjectionToken<boolean>('angularfire2.analytics.logScreenViews');
export const APP_VERSION = new InjectionToken<string>('angularfire2.analytics.appVersion');
export const APP_NAME = new InjectionToken<string>('angularfire2.analytics.appName');

const DEFAULT_APP_VERSION = '?';
const DEFAULT_APP_NAME = 'Angular App';

@Injectable({
    providedIn: 'root'
})
export class ScreenTrackingService implements OnDestroy {

    private disposable: Subscription|undefined;
  
    constructor(
      analytics: AngularFireAnalytics,
      @Optional() router:Router,
      @Optional() @Inject(AUTOMATICALLY_SET_CURRENT_SCREEN) automaticallySetCurrentScreen:boolean|null,
      @Optional() @Inject(AUTOMATICALLY_LOG_SCREEN_VIEWS) automaticallyLogScreenViews:boolean|null,
      @Optional() @Inject(APP_VERSION) providedAppVersion:string|null,
      @Optional() @Inject(APP_NAME) providedAppName:string|null,
      zone: NgZone
    ) {
        if (!router) {
            // TODO warning about Router
        } else if (automaticallySetCurrentScreen !== false || automaticallyLogScreenViews !== false) {
            const app_name = providedAppName || DEFAULT_APP_NAME;
            const app_version = providedAppVersion || DEFAULT_APP_VERSION;
            const activationEndEvents = router.events.pipe(filter<ActivationEnd>(e => e instanceof ActivationEnd));
            const navigationEndEvents = router.events.pipe(filter<NavigationEnd>(e => e instanceof NavigationEnd));
            this.disposable = navigationEndEvents.pipe(
                withLatestFrom(activationEndEvents),
                switchMap(([navigationEnd, activationEnd]) => {
                    const url = navigationEnd.url;
                    const screen_name = activationEnd.snapshot.routeConfig && activationEnd.snapshot.routeConfig.path || url;
                    const outlet = activationEnd.snapshot.outlet;
                    const component = activationEnd.snapshot.component;
                    const ret = new Array<Promise<void>>();
                    if (automaticallyLogScreenViews !== false) {
                        if (component) {
                            const screen_class = component.hasOwnProperty('name') && (component as any).name || component.toString();
                            ret.push(analytics.logEvent("screen_view", { app_name, screen_class, app_version, screen_name, outlet, url }));
                        } else if (activationEnd.snapshot.routeConfig && activationEnd.snapshot.routeConfig.loadChildren) {
                            ret.push((activationEnd.snapshot.routeConfig.loadChildren as any)().then((child:any) => {
                                const screen_class = child.name;
                                console.log("logEvent", "screen_view", { app_name, screen_class, app_version, screen_name, outlet, url });
                                return analytics.logEvent("screen_view", { app_name, screen_class, app_version, screen_name, outlet, url });
                            }));
                        } else {
                            ret.push(analytics.logEvent("screen_view", { app_name, app_version, screen_name, outlet, url }));
                        }
                    }
                    if (automaticallySetCurrentScreen !== false) {
                        ret.push(analytics.setCurrentScreen(screen_name || url, { global: outlet == "primary" }));
                    }
                    return Promise.all(ret);
                }),
                runOutsideAngular(zone)
            ).subscribe();
        }
    }
  
    ngOnDestroy() {
      if (this.disposable) { this.disposable.unsubscribe(); }
    }
  
}

@Injectable({
    providedIn: 'root'
})
export class UserTrackingService implements OnDestroy {

    private disposable: Subscription|undefined;

    // TODO a user properties injector
    constructor(
        analytics: AngularFireAnalytics,
        zone: NgZone
    ) {
        this.disposable = from(analytics.app).pipe(
            // TODO can I hook into auth being loaded...
            map(app => app.auth()),
            switchMap(auth => auth ? new Observable<User>(auth.onAuthStateChanged.bind(auth)) : empty()),
            switchMap(user => analytics.setUserId(user ? user.uid : null!, { global: true })),
            runOutsideAngular(zone)
        ).subscribe();
    }

    ngOnDestroy() {
        if (this.disposable) { this.disposable.unsubscribe(); }
    }
}