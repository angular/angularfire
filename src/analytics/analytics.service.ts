import { Injectable, Optional, NgZone, OnDestroy } from '@angular/core';
import { Subscription, from, Observable, empty, of } from 'rxjs';
import { filter, withLatestFrom, switchMap, map, tap, pairwise, startWith, groupBy, mergeMap } from 'rxjs/operators';
import { Router, NavigationEnd, ActivationEnd } from '@angular/router';
import { runOutsideAngular } from '@angular/fire';
import { AngularFireAnalytics } from './analytics';
import { User } from 'firebase/app';
import { Title } from '@angular/platform-browser';

// Gold seems to take page_title and screen_path but the v2 protocol doesn't seem
// to allow any class name, obviously v2 was designed for the basic web. I'm still
// sending firebase_screen_class (largely for BQ compatability) but the Firebase Console
// doesn't appear to be consuming the event properties.
// FWIW I'm seeing notes that firebase_* is depreciated in favor of ga_* in GMS... so IDK 
const SCREEN_NAME_KEY = 'screen_name';
const PAGE_PATH_KEY = 'page_path';
const EVENT_ORIGIN_KEY = 'event_origin';
const FIREBASE_SCREEN_NAME_KEY = 'firebase_screen';
const SCREEN_CLASS_KEY = 'firebase_screen_class';
const OUTLET_KEY = 'outlet';
const PAGE_TITLE_KEY = 'page_title';
const PREVIOUS_SCREEN_CLASS_KEY = 'firebase_previous_class';
const PREVIOUS_SCREEN_INSTANCE_ID_KEY  = 'firebase_previous_id';
const PREVIOUS_SCREEN_NAME_KEY = 'firebase_previous_screen';
const SCREEN_INSTANCE_ID_KEY = 'firebase_screen_id';

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
      zone: NgZone
    ) {
        if (!router) { return this }
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
                    [EVENT_ORIGIN_KEY]: EVENT_ORIGIN_AUTO,
                    [FIREBASE_SCREEN_NAME_KEY]: screen_name,
                    [OUTLET_KEY]: activationEnd.snapshot.outlet
                };
                if (title) { params[PAGE_TITLE_KEY] = title.getTitle() }
                const component = activationEnd.snapshot.component;
                const routeConfig = activationEnd.snapshot.routeConfig;
                // TODO maybe not lean on _loadedConfig...
                const loadedConfig = routeConfig && (routeConfig as any)._loadedConfig;
                const loadChildren = routeConfig && routeConfig.loadChildren;
                if (component) {
                    return of({...params, [SCREEN_CLASS_KEY]: nameOrToString(component) });
                } else if (loadedConfig && loadedConfig.module && loadedConfig.module._moduleType) {
                    return of({...params, [SCREEN_CLASS_KEY]: nameOrToString(loadedConfig.module._moduleType)});
                } else if (typeof loadChildren === "string") {
                    // TODO is the an older lazy loading style? parse, if so
                    return of({...params, [SCREEN_CLASS_KEY]: loadChildren });
                } else if (loadChildren) {
                    // TODO look into the other return types here
                    return from(loadChildren() as Promise<any>).pipe(map(child => ({...params, [SCREEN_CLASS_KEY]: nameOrToString(child) })));
                } else {
                    // TODO figure out what forms of router events I might be missing
                    return of({...params, [SCREEN_CLASS_KEY]: DEFAULT_SCREEN_CLASS});
                }
            }),
            tap(params => {
                // TODO perhaps I can be smarter about this, bubble events up to the nearest outlet?
                if (params[OUTLET_KEY] == NG_PRIMARY_OUTLET) {
                    // TODO do we want to track the firebase_ attributes?
                    analytics.setCurrentScreen(params.screen_name);
                    analytics.updateConfig({ [PAGE_PATH_KEY]: params[PAGE_PATH_KEY] });
                    if (title) { analytics.updateConfig({ [PAGE_TITLE_KEY]: params[PAGE_TITLE_KEY] }) }
                }
            }),
            map(params => ({ [SCREEN_INSTANCE_ID_KEY]: getScreenInstanceID(params), ...params })),
            groupBy(params => params[OUTLET_KEY]),
            mergeMap(group => group.pipe(startWith(undefined), pairwise())),
            map(([prior, current]) => prior ? {
                [PREVIOUS_SCREEN_CLASS_KEY]: prior[SCREEN_CLASS_KEY],
                [PREVIOUS_SCREEN_NAME_KEY]: prior[SCREEN_NAME_KEY],
                [PREVIOUS_SCREEN_INSTANCE_ID_KEY]: prior[SCREEN_INSTANCE_ID_KEY],
                ...current!
            } : current!),
            tap(params => analytics.logEvent(SCREEN_VIEW_EVENT, params)),
            runOutsideAngular(zone)
        ).subscribe();
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

const nameOrToString = (it:any): string => it.name || it.toString();