import { Injectable, Optional, NgZone, OnDestroy, ComponentFactoryResolver, Inject, PLATFORM_ID } from '@angular/core';
import { Subscription, from, Observable, empty, of } from 'rxjs';
import { filter, withLatestFrom, switchMap, map, tap, pairwise, startWith, groupBy, mergeMap } from 'rxjs/operators';
import { Router, NavigationEnd, ActivationEnd } from '@angular/router';
import { runOutsideAngular } from '@angular/fire';
import { AngularFireAnalytics } from './analytics';
import { User } from 'firebase/app';
import { Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

const FIREBASE_EVENT_ORIGIN_KEY = 'firebase_event_origin';
const FIREBASE_PREVIOUS_SCREEN_CLASS_KEY = 'firebase_previous_class';
const FIREBASE_PREVIOUS_SCREEN_INSTANCE_ID_KEY  = 'firebase_previous_id';
const FIREBASE_PREVIOUS_SCREEN_NAME_KEY = 'firebase_previous_screen';
const FIREBASE_SCREEN_CLASS_KEY = 'firebase_screen_class';
const FIREBASE_SCREEN_INSTANCE_ID_KEY = 'firebase_screen_id';
const FIREBASE_SCREEN_NAME_KEY = 'firebase_screen';
const OUTLET_KEY = 'outlet';
const PAGE_PATH_KEY = 'page_path';
const PAGE_TITLE_KEY = 'page_title';
const SCREEN_CLASS_KEY = 'screen_class';
const SCREEN_NAME_KEY = 'screen_name';

const SCREEN_VIEW_EVENT = 'screen_view';
const EVENT_ORIGIN_AUTO = 'auto';
const DEFAULT_SCREEN_CLASS = '???';
const NG_PRIMARY_OUTLET = 'primary';
const SCREEN_INSTANCE_DELIMITER = '#';

@Injectable()
export class ScreenTrackingService implements OnDestroy {

    private disposable: Subscription|undefined;
  
    constructor(
      analytics: AngularFireAnalytics,
      @Optional() router:Router,
      @Optional() title:Title,
      componentFactoryResolver: ComponentFactoryResolver,
      @Inject(PLATFORM_ID) platformId:Object,
      zone: NgZone
    ) {
        if (!router || !isPlatformBrowser(platformId)) { return this }
        zone.runOutsideAngular(() => {
            const activationEndEvents = router.events.pipe(filter<ActivationEnd>(e => e instanceof ActivationEnd));
            const navigationEndEvents = router.events.pipe(filter<NavigationEnd>(e => e instanceof NavigationEnd));
            this.disposable = navigationEndEvents.pipe(
                withLatestFrom(activationEndEvents),
                switchMap(([navigationEnd, activationEnd]) => {
                    // SEMVER: start using optional chains and nullish coalescing once we support newer typescript
                    const page_path = navigationEnd.url;
                    const screen_name = activationEnd.snapshot.routeConfig && activationEnd.snapshot.routeConfig.path || page_path;
                    const params = {
                        [SCREEN_NAME_KEY]: screen_name,
                        [PAGE_PATH_KEY]: page_path,
                        [FIREBASE_EVENT_ORIGIN_KEY]: EVENT_ORIGIN_AUTO,
                        [FIREBASE_SCREEN_NAME_KEY]: screen_name,
                        [OUTLET_KEY]: activationEnd.snapshot.outlet
                    };
                    if (title) {
                        params[PAGE_TITLE_KEY] = title.getTitle()
                    }
                    const component = activationEnd.snapshot.component;
                    const routeConfig = activationEnd.snapshot.routeConfig;
                    const loadChildren = routeConfig && routeConfig.loadChildren;
                    // TODO figure out how to handle minification
                    if (typeof loadChildren === "string") {
                        // SEMVER: this is the older lazy load style "./path#ClassName", drop this when we drop old ng
                        // TODO is it worth seeing if I can look up the component factory selector from the module name?
                        // it's lazy so it's not registered with componentFactoryResolver yet... seems a pain for a depreciated style
                        return of({...params, [SCREEN_CLASS_KEY]: loadChildren.split('#')[1]});
                    } else if (typeof component === 'string') {
                        // TODO figure out when this would this be a string
                        return of({...params, [SCREEN_CLASS_KEY]: component });
                    } else if (component) {
                        const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
                        return of({...params, [SCREEN_CLASS_KEY]: componentFactory.selector });
                    } else if (loadChildren) {
                        const loadedChildren = loadChildren();
                        var loadedChildren$: Observable<any>;
                        // TODO clean up this handling...
                        // can componentFactorymoduleType take an ngmodulefactory or should i pass moduletype?
                        try { loadedChildren$ = from(zone.runOutsideAngular(() => loadedChildren as any)) } catch(_) { loadedChildren$ = of(loadedChildren as any) }
                        return loadedChildren$.pipe(map(child => {
                            const componentFactory = componentFactoryResolver.resolveComponentFactory(child);
                            return {...params, [SCREEN_CLASS_KEY]: componentFactory.selector };
                        }));
                    } else {
                        // TODO figure out what forms of router events I might be missing
                        return of({...params, [SCREEN_CLASS_KEY]: DEFAULT_SCREEN_CLASS});
                    }
                }),
                map(params => ({
                    [FIREBASE_SCREEN_CLASS_KEY]: params[SCREEN_CLASS_KEY],
                    [FIREBASE_SCREEN_INSTANCE_ID_KEY]: getScreenInstanceID(params),
                    ...params
                })),
                tap(params => {
                    // TODO perhaps I can be smarter about this, bubble events up to the nearest outlet?
                    if (params[OUTLET_KEY] == NG_PRIMARY_OUTLET) {
                        analytics.setCurrentScreen(params[SCREEN_NAME_KEY]);
                        analytics.updateConfig({
                            [PAGE_PATH_KEY]: params[PAGE_PATH_KEY],
                            [SCREEN_CLASS_KEY]: params[SCREEN_CLASS_KEY]
                        });
                        if (title) {
                            analytics.updateConfig({ [PAGE_TITLE_KEY]: params[PAGE_TITLE_KEY] })
                        }
                    }
                }),
                groupBy(params => params[OUTLET_KEY]),
                mergeMap(group => group.pipe(startWith(undefined), pairwise())),
                map(([prior, current]) => prior ? {
                    [FIREBASE_PREVIOUS_SCREEN_CLASS_KEY]: prior[SCREEN_CLASS_KEY],
                    [FIREBASE_PREVIOUS_SCREEN_NAME_KEY]: prior[SCREEN_NAME_KEY],
                    [FIREBASE_PREVIOUS_SCREEN_INSTANCE_ID_KEY]: prior[FIREBASE_SCREEN_INSTANCE_ID_KEY],
                    ...current!
                } : current!),
                tap(params => zone.runOutsideAngular(() => analytics.logEvent(SCREEN_VIEW_EVENT, params)))
            ).subscribe();
        });
    }
  
    ngOnDestroy() {
      if (this.disposable) { this.disposable.unsubscribe(); }
    }
  
}

@Injectable()
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
            switchMap(user => analytics.setUserId(user ? user.uid : null!)),
            runOutsideAngular(zone)
        ).subscribe();
    }

    ngOnDestroy() {
        if (this.disposable) { this.disposable.unsubscribe(); }
    }
}

// this is an INT64 in iOS/Android but use INT32 cause javascript
let nextScreenInstanceID = Math.floor(Math.random() * (2**32 - 1)) - 2**31;

const knownScreenInstanceIDs: {[key:string]: number} = {};

const getScreenInstanceID = (params:{[key:string]: any}) => {
    // unique the screen class against the outlet name
    const screenInstanceKey = [
        params[SCREEN_CLASS_KEY],
        params[OUTLET_KEY]
    ].join(SCREEN_INSTANCE_DELIMITER);
    if (knownScreenInstanceIDs.hasOwnProperty(screenInstanceKey)) {
        return knownScreenInstanceIDs[screenInstanceKey];
    } else {
        const ret = nextScreenInstanceID++;
        knownScreenInstanceIDs[screenInstanceKey] = ret;
        return ret;
    }
}