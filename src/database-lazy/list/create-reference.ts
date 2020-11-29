import { AngularFireList, ChildEvent, DatabaseQuery } from '../interfaces';
import { snapshotChanges } from './snapshot-changes';
import { stateChanges } from './state-changes';
import { auditTrail } from './audit-trail';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';
import { AngularFireDatabase } from '../database';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export function createListReference<T= any>(query$: Observable<DatabaseQuery>, afDatabase: AngularFireDatabase): AngularFireList<T> {
  const outsideAngularScheduler = afDatabase.schedulers.outsideAngular;
  const ref$ = query$.pipe(map(query => afDatabase.schedulers.ngZone.run(() => query.ref)));
  return {
    query: query$.toPromise(),
    update: createDataOperationMethod<Partial<T>>(ref$, 'update'),
    set: createDataOperationMethod<T>(ref$, 'set'),
    push: (data: T) => {
      // this should be a hot observable
      const obs = ref$.pipe(map(ref => ref.push(data)), shareReplay({ bufferSize: 1, refCount: false }));
      obs.subscribe();
      return obs;
    },
    remove: createRemoveMethod(ref$),
    snapshotChanges: (events?: ChildEvent[]) => query$.pipe(
      switchMap(query => snapshotChanges<T>(query, events, outsideAngularScheduler)),
      afDatabase.keepUnstableUntilFirst,
    ),
    stateChanges: (events?: ChildEvent[]) => query$.pipe(
      switchMap(query => stateChanges<T>(query, events, outsideAngularScheduler)),
      afDatabase.keepUnstableUntilFirst,
    ),
    auditTrail: (events?: ChildEvent[]) => query$.pipe(
      switchMap(query => auditTrail<T>(query, events, outsideAngularScheduler)),
      afDatabase.keepUnstableUntilFirst
    ),
    valueChanges: <K extends string>(events?: ChildEvent[], options?: {idField?: K}) => query$.pipe(
      switchMap(query => snapshotChanges<T>(query, events, outsideAngularScheduler)),
      map(actions => actions.map(a => {
        if (options && options.idField) {
          return {
            ...a.payload.val() as T,
            ...{
              [options.idField]: a.key
            }
          };
        } else {
          return a.payload.val() as T;
        }
      })),
      afDatabase.keepUnstableUntilFirst
    ),
  };
}
