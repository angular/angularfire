import { ComponentFactoryResolver, Injectable, NgZone, OnDestroy, Optional, Injector } from '@angular/core';
import { of, Subscription, Observable } from 'rxjs';
import { distinctUntilChanged, filter, groupBy, map, mergeMap, pairwise, startWith, switchMap } from 'rxjs/operators';
import { ActivationEnd, Router, ɵEmptyOutletComponent } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { VERSION, ɵisAnalyticsSupportedFactory } from '@angular/fire';
import { registerVersion } from 'firebase/app';

import { Analytics } from './analytics';
import { logEvent } from './firebase';
import { UserTrackingService } from './user-tracking.service';

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
const SCREEN_INSTANCE_DELIMITER = '#';

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

export const ɵscreenViewEvent = (
  router: Router,
  title: Title|null,
  componentFactoryResolver: ComponentFactoryResolver,
): Observable<{
  [SCREEN_NAME_KEY]: string,
  [PAGE_PATH_KEY]: string,
  [FIREBASE_EVENT_ORIGIN_KEY]: 'auto',
  [FIREBASE_SCREEN_NAME_KEY]: string,
  [OUTLET_KEY]: string,
  [PAGE_TITLE_KEY]?: string,
  [SCREEN_CLASS_KEY]: string,
  [FIREBASE_SCREEN_CLASS_KEY]: string,
  [FIREBASE_SCREEN_INSTANCE_ID_KEY]: number,
  [FIREBASE_PREVIOUS_SCREEN_CLASS_KEY]: string,
  [FIREBASE_PREVIOUS_SCREEN_NAME_KEY]: string,
  [FIREBASE_PREVIOUS_SCREEN_INSTANCE_ID_KEY]: number,
}> => {
  const activationEndEvents = router.events.pipe(filter<ActivationEnd>(e => e instanceof ActivationEnd));
  return activationEndEvents.pipe(
    switchMap<ActivationEnd, Observable<Record<string, any>|null>>(activationEnd => {
      // router parseUrl is having trouble with outlets when they're empty
      // e.g, /asdf/1(bob://sally:asdf), so put another slash in when empty
      const urlTree = router.parseUrl(router.url.replace(/(?:\().+(?:\))/g, a => a.replace('://', ':///')));
      const pagePath = urlTree.root.children[activationEnd.snapshot.outlet]?.toString() || '';
      const actualSnapshot = router.routerState.root.children.map(it => it).find(it => it.outlet === activationEnd.snapshot.outlet);

      if (!actualSnapshot) {
        return of(null);
      }

      let actualDeep = actualSnapshot;
      while (actualDeep.firstChild) {
        actualDeep = actualDeep.firstChild;
      }
      const screenName = actualDeep.pathFromRoot.map(s => s.routeConfig?.path).filter(it => it).join('/') || '/';

      const params = {
        [SCREEN_NAME_KEY]: screenName,
        [PAGE_PATH_KEY]: `/${pagePath}`,
        [FIREBASE_EVENT_ORIGIN_KEY]: EVENT_ORIGIN_AUTO,
        [FIREBASE_SCREEN_NAME_KEY]: screenName,
        [OUTLET_KEY]: activationEnd.snapshot.outlet
      };
      if (title) {
        params[PAGE_TITLE_KEY] = title.getTitle();
      }

      let component = actualSnapshot.component;
      if (component) {
        if (component === ɵEmptyOutletComponent) {
          let deepSnapshot = activationEnd.snapshot;
          // TODO when might there be mutple children, different outlets? explore
          while (deepSnapshot.firstChild) {
            deepSnapshot = deepSnapshot.firstChild;
          }
          component = deepSnapshot.component;
        }
      } else {
        component = activationEnd.snapshot.component;
      }

      if (typeof component === 'string') {
        return of({ ...params, [SCREEN_CLASS_KEY]: component });
      } else if (component) {
        const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
        return of({ ...params, [SCREEN_CLASS_KEY]: componentFactory.selector });
      }
      // lazy loads cause extra activations, ignore
      return of(null);
    }),
    filter(it => !!it),
    map(params => ({
      [FIREBASE_SCREEN_CLASS_KEY]: params[SCREEN_CLASS_KEY],
      [FIREBASE_SCREEN_INSTANCE_ID_KEY]: getScreenInstanceID(params),
      ...params
    })),
    groupBy(it => it[OUTLET_KEY]),
    mergeMap(it => it.pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      startWith<any, any>(undefined),
      pairwise(),
      map(([prior, current]) =>
        prior ? {
          [FIREBASE_PREVIOUS_SCREEN_CLASS_KEY]: prior[SCREEN_CLASS_KEY],
          [FIREBASE_PREVIOUS_SCREEN_NAME_KEY]: prior[SCREEN_NAME_KEY],
          [FIREBASE_PREVIOUS_SCREEN_INSTANCE_ID_KEY]: prior[FIREBASE_SCREEN_INSTANCE_ID_KEY],
          ...current
        } : current
      ),
    ))
  );
};

@Injectable()
export class ScreenTrackingService implements OnDestroy {

  private disposable: Subscription | undefined;

  constructor(
    @Optional() router: Router,
    @Optional() title: Title,
    componentFactoryResolver: ComponentFactoryResolver,
    zone: NgZone,
    @Optional() userTrackingService: UserTrackingService,
    injector: Injector,
  ) {
    registerVersion('angularfire', VERSION.full, 'screen-tracking');
    ɵisAnalyticsSupportedFactory.async().then(() => {
      const analytics = injector.get(Analytics);
      if (!router || !analytics) { return; }
      zone.runOutsideAngular(() => {
        this.disposable = ɵscreenViewEvent(router, title, componentFactoryResolver).pipe(
          switchMap(async params => {
            if (userTrackingService) { await userTrackingService.initialized; }
            return logEvent(analytics, SCREEN_VIEW_EVENT, params);
          })
        ).subscribe();
      });
    });
  }

  ngOnDestroy() {
    if (this.disposable) {
      this.disposable.unsubscribe();
    }
  }

}
