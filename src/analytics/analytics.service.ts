import {
  ComponentFactoryResolver,
  Inject,
  Injectable,
  Injector,
  NgModuleFactory,
  NgZone,
  OnDestroy,
  Optional,
  PLATFORM_ID
} from '@angular/core';
import { from, Observable, of, Subscription } from 'rxjs';
import { filter, groupBy, map, mergeMap, observeOn, pairwise, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { ActivationEnd, NavigationEnd, Router, ROUTES } from '@angular/router';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { AngularFireAnalytics, DEBUG_MODE } from './analytics';
import firebase from 'firebase/app';
import { Title } from '@angular/platform-browser';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

const FIREBASE_EVENT_ORIGIN_KEY = 'firebase_event_origin';
const FIREBASE_PREVIOUS_SCREEN_CLASS_KEY = 'firebase_previous_class';
const FIREBASE_PREVIOUS_SCREEN_INSTANCE_ID_KEY = 'firebase_previous_id';
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

const ANNOTATIONS = '__annotations__';


// this is an INT64 in iOS/Android but use INT32 cause javascript
let nextScreenInstanceID = Math.floor(Math.random() * (2 ** 32 - 1)) - 2 ** 31;

const knownScreenInstanceIDs: { [key: string]: number } = {};

const getScreenInstanceID = (params: { [key: string]: any }) => {
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
};

@Injectable()
export class ScreenTrackingService implements OnDestroy {

  private disposable: Subscription | undefined;

  constructor(
    analytics: AngularFireAnalytics,
    @Optional() router: Router,
    @Optional() title: Title,
    componentFactoryResolver: ComponentFactoryResolver,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    @Optional() @Inject(DEBUG_MODE) debugModeEnabled: boolean | null,
    zone: NgZone,
    injector: Injector
  ) {
    if (!router || !isPlatformBrowser(platformId)) {
      return this;
    }
    zone.runOutsideAngular(() => {
      const activationEndEvents = router.events.pipe(filter<ActivationEnd>(e => e instanceof ActivationEnd));
      const navigationEndEvents = router.events.pipe(filter<NavigationEnd>(e => e instanceof NavigationEnd));
      this.disposable = navigationEndEvents.pipe(
        withLatestFrom(activationEndEvents),
        switchMap(([navigationEnd, activationEnd]) => {
          // SEMVER: start using optional chains and nullish coalescing once we support newer typescript
          const pagePath = navigationEnd.url;
          const screenName = activationEnd.snapshot.routeConfig && activationEnd.snapshot.routeConfig.path || pagePath;
          const params = {
            [SCREEN_NAME_KEY]: screenName,
            [PAGE_PATH_KEY]: pagePath,
            [FIREBASE_EVENT_ORIGIN_KEY]: EVENT_ORIGIN_AUTO,
            [FIREBASE_SCREEN_NAME_KEY]: screenName,
            [OUTLET_KEY]: activationEnd.snapshot.outlet
          };
          if (title) {
            params[PAGE_TITLE_KEY] = title.getTitle();
          }
          const component = activationEnd.snapshot.component;
          const routeConfig = activationEnd.snapshot.routeConfig;
          const loadChildren = routeConfig && routeConfig.loadChildren;
          // TODO figure out how to handle minification
          if (typeof loadChildren === 'string') {
            // SEMVER: this is the older lazy load style "./path#ClassName", drop this when we drop old ng
            // TODO is it worth seeing if I can look up the component factory selector from the module name?
            // it's lazy so it's not registered with componentFactoryResolver yet... seems a pain for a depreciated style
            return of({ ...params, [SCREEN_CLASS_KEY]: loadChildren.split('#')[1] });
          } else if (typeof component === 'string') {
            return of({ ...params, [SCREEN_CLASS_KEY]: component });
          } else if (component) {
            const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
            return of({ ...params, [SCREEN_CLASS_KEY]: componentFactory.selector });
          } else if (loadChildren) {
            const loadedChildren = loadChildren();
            const loadedChildren$: Observable<any> = (loadedChildren instanceof Observable) ?
              loadedChildren :
              from(Promise.resolve(loadedChildren));
            return loadedChildren$.pipe(
              map(lazyModule => {
                if (lazyModule instanceof NgModuleFactory) {
                  // AOT create an injector
                  const moduleRef = lazyModule.create(injector);
                  // INVESTIGATE is this the right way to get at the matching route?
                  const routes = moduleRef.injector.get(ROUTES);
                  const component = routes[0][0].component; // should i just be grabbing 0-0 here?
                  try {
                    const componentFactory = moduleRef.componentFactoryResolver.resolveComponentFactory(component);
                    return { ...params, [SCREEN_CLASS_KEY]: componentFactory.selector };
                  } catch (_) {
                    return { ...params, [SCREEN_CLASS_KEY]: DEFAULT_SCREEN_CLASS };
                  }
                } else {
                  // JIT look at the annotations
                  // INVESTIGATE are there public APIs for this stuff?
                  const declarations = [].concat.apply([], (lazyModule[ANNOTATIONS] || []).map((f: any) => f.declarations));
                  const selectors = [].concat.apply([], declarations.map((c: any) => (c[ANNOTATIONS] || []).map((f: any) => f.selector)));
                  // should I just be grabbing the selector like this or should i match against the route component?
                  //   const routerModule = lazyModule.ngInjectorDef.imports.find(i => i.ngModule && ....);
                  //   const route = routerModule.providers[0].find(p => p.provide == ROUTES).useValue[0];
                  return { ...params, [SCREEN_CLASS_KEY]: selectors[0] || DEFAULT_SCREEN_CLASS };
                }
              })
            );
          } else {
            return of({ ...params, [SCREEN_CLASS_KEY]: DEFAULT_SCREEN_CLASS });
          }
        }),
        map(params => ({
          [FIREBASE_SCREEN_CLASS_KEY]: params[SCREEN_CLASS_KEY],
          [FIREBASE_SCREEN_INSTANCE_ID_KEY]: getScreenInstanceID(params),
          ...params
        })),
        tap(params => {
          // TODO perhaps I can be smarter about this, bubble events up to the nearest outlet?
          if (params[OUTLET_KEY] === NG_PRIMARY_OUTLET) {
            analytics.setCurrentScreen(params[SCREEN_NAME_KEY]);
            analytics.updateConfig({
              [PAGE_PATH_KEY]: params[PAGE_PATH_KEY],
              [SCREEN_CLASS_KEY]: params[SCREEN_CLASS_KEY]
            });
            if (title) {
              analytics.updateConfig({ [PAGE_TITLE_KEY]: params[PAGE_TITLE_KEY] });
            }
          }
        }),
        groupBy(params => params[OUTLET_KEY]),
        // tslint:disable-next-line
        mergeMap(group => group.pipe(startWith(undefined), pairwise())),
        map(([prior, current]) => prior ? {
          [FIREBASE_PREVIOUS_SCREEN_CLASS_KEY]: prior[SCREEN_CLASS_KEY],
          [FIREBASE_PREVIOUS_SCREEN_NAME_KEY]: prior[SCREEN_NAME_KEY],
          [FIREBASE_PREVIOUS_SCREEN_INSTANCE_ID_KEY]: prior[FIREBASE_SCREEN_INSTANCE_ID_KEY],
          ...current
        } : current),
        // tslint:disable-next-line:no-console
        tap(params => debugModeEnabled && console.info(SCREEN_VIEW_EVENT, params)),
        tap(params => zone.runOutsideAngular(() => analytics.logEvent(SCREEN_VIEW_EVENT, params)))
      ).subscribe();
    });
  }

  ngOnDestroy() {
    if (this.disposable) {
      this.disposable.unsubscribe();
    }
  }

}

@Injectable()
export class UserTrackingService implements OnDestroy {

  private disposable: Subscription | undefined;

  // TODO a user properties injector
  constructor(
    analytics: AngularFireAnalytics,
    zone: NgZone,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);

    if (!isPlatformServer(platformId)) {
      zone.runOutsideAngular(() => {
        // @ts-ignore zap the import in the UMD
        this.disposable = from(import('firebase/auth')).pipe(
          observeOn(schedulers.outsideAngular),
          switchMap(() => analytics.app),
          map(app => app.auth()),
          switchMap(auth => new Observable<firebase.User | null>(auth.onAuthStateChanged.bind(auth))),
          switchMap(user => analytics.setUserId(user ? user.uid : null))
        ).subscribe();
      });
    }
  }

  ngOnDestroy() {
    if (this.disposable) {
      this.disposable.unsubscribe();
    }
  }
}
