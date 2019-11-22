import { Injectable, Inject, Optional, NgZone, OnDestroy, InjectionToken } from '@angular/core';
import { Subscription, from, Observable, empty, of } from 'rxjs';
import { filter, withLatestFrom, switchMap, map, tap, pairwise, startWith, groupBy, mergeMap } from 'rxjs/operators';
import { Router, NavigationEnd, ActivationEnd } from '@angular/router';
import { runOutsideAngular, _lazySDKProxy, _firebaseAppFactory } from '@angular/fire';
import { AngularFireAnalytics } from './analytics';
import { User } from 'firebase/app';

export const APP_VERSION = new InjectionToken<string>('angularfire2.analytics.appVersion');
export const APP_NAME = new InjectionToken<string>('angularfire2.analytics.appName');

const DEFAULT_APP_VERSION = '?';
const DEFAULT_APP_NAME = 'Angular App';

type AngularFireAnalyticsEventParams = {
    app_name: string;
    firebase_screen_class: string | undefined;
    firebase_screen: string;
    app_version: string;
    screen_name: string;
    outlet: string;
    url: string;
};

@Injectable({
    providedIn: 'root'
})
export class ScreenTrackingService implements OnDestroy {

    private disposable: Subscription|undefined;
  
    constructor(
      analytics: AngularFireAnalytics,
      @Optional() router:Router,
      @Optional() @Inject(APP_VERSION) providedAppVersion:string|null,
      @Optional() @Inject(APP_NAME) providedAppName:string|null,
      zone: NgZone
    ) {
        if (!router) { return this }
        const app_name = providedAppName || DEFAULT_APP_NAME;
        const app_version = providedAppVersion || DEFAULT_APP_VERSION;
        const activationEndEvents = router.events.pipe(filter<ActivationEnd>(e => e instanceof ActivationEnd));
        const navigationEndEvents = router.events.pipe(filter<NavigationEnd>(e => e instanceof NavigationEnd));
        this.disposable = navigationEndEvents.pipe(
            withLatestFrom(activationEndEvents),
            switchMap(([navigationEnd, activationEnd]) => {
                const url = navigationEnd.url;
                const screen_name = activationEnd.snapshot.routeConfig && activationEnd.snapshot.routeConfig.path || url;
                const params: AngularFireAnalyticsEventParams = {
                    app_name, app_version, screen_name, url,
                    firebase_screen_class: undefined,
                    firebase_screen: screen_name,
                    outlet: activationEnd.snapshot.outlet
                };
                const component = activationEnd.snapshot.component;
                const routeConfig = activationEnd.snapshot.routeConfig;
                const loadedConfig = routeConfig && (routeConfig as any)._loadedConfig;
                const loadChildren = routeConfig && routeConfig.loadChildren;
                if (component) {
                    return of({...params, firebase_screen_class: nameOrToString(component) });
                } else if (loadedConfig && loadedConfig.module && loadedConfig.module._moduleType) {
                    return of({...params, firebase_screen_class: nameOrToString(loadedConfig.module._moduleType)});
                } else if (typeof loadChildren === "string") {
                    // TODO is this an older lazy loading style parse
                    return of({...params, firebase_screen_class: loadChildren });
                } else if (loadChildren) {
                    // TODO look into the other return types here
                    return from(loadChildren() as Promise<any>).pipe(map(child => ({...params, firebase_screen_class: nameOrToString(child) })));
                } else {
                    // TODO figure out what forms of router events I might be missing
                    return of(params);
                }
            }),
            tap(params => {
                // TODO perhaps I can be smarter about this, bubble events up to the nearest outlet?
                if (params.outlet == "primary") {
                    // TODO do I need to add gtag config for firebase_screen, firebase_screen_class, firebase_screen_id?
                    //      also shouldn't these be computed in the setCurrentScreen function? prior too?
                    //      do we want to be logging screen name or class?
                    analytics.setCurrentScreen(params.screen_name, { global: true })
                }
            }),
            map(params => ({ firebase_screen_id: nextScreenId(params), ...params})),
            groupBy(params => params.outlet),
            mergeMap(group => group.pipe(startWith(undefined), pairwise())),
            map(([prior, current]) => prior ? {
                firebase_previous_class: prior.firebase_screen_class,
                firebase_previous_screen: prior.firebase_screen,
                firebase_previous_id: prior.firebase_screen_id,
                ...current!
            } : current!),
            tap(params => analytics.logEvent('screen_view', params)),
            runOutsideAngular(zone)
        ).subscribe();
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

// firebase_screen_id is an INT64 but use INT32 cause javascript
const randomInt32 = () => Math.floor(Math.random() * (2**32 - 1)) - 2**31;

const currentScreenIds: {[key:string]: number} = {};

const nextScreenId = (params:AngularFireAnalyticsEventParams) => {
    const scope = params.outlet;
    if (currentScreenIds.hasOwnProperty(scope)) {
        return ++currentScreenIds[scope];
    } else {
        const ret = randomInt32();
        currentScreenIds[scope] = ret;
        return ret;
    }
}

const nameOrToString = (it:any): string => it.name || it.toString();