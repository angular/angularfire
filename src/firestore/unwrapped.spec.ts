import { isDevMode } from '@angular/core';
import { LogLevel, setLogLevel } from '@angular/fire';
import * as angularFire from '@angular/fire/firestore';
import { deleteApp, initializeApp } from 'firebase/app';
import * as sdk from 'firebase/firestore';
import { COMMON_CONFIG, firestoreEmulatorPort } from '../test-config';
import { rando } from '../utils';
import {
  UNWRAPPED_FIRESTORE_FUNCTIONS,
  UNWRAPPED_FULL_SDK_ONLY,
  expectExactlyTheseUnwrapped,
  expectSynchronousAndTaskFree,
  recordScheduledTasks,
} from './zone-wrap-spec-support';

const noop = () => undefined;

describe('Firestore functions re-exported without the zone wrapper', () => {

  describe('the task recorder', () => {
    it('sees a timer', async () => {
      expect((await recordScheduledTasks(() => setTimeout(noop, 0))).tasks).toEqual(['macroTask:setTimeout']);
    });

    it('sees a promise callback', async () => {
      expect((await recordScheduledTasks(() => Promise.resolve().then(noop))).tasks).toEqual(['microTask:Promise.then']);
    });

    it('sees a promise callback attached to a promise that settles after the call returns', async () => {
      let settle = noop;
      const pending = new Promise<void>(resolve => settle = resolve);
      setTimeout(settle, 0);
      expect((await recordScheduledTasks(() => pending.then(noop))).tasks).toEqual(['microTask:Promise.then']);
    });

    it('sees an event listener', async () => {
      const eventName = `zone-wrap-spec-${rando()}`;
      try {
        const { tasks } = await recordScheduledTasks(() => document.addEventListener(eventName, noop));
        expect(tasks.length).toBe(1);
        expect(tasks[0]).toMatch(new RegExp(`^eventTask:.*${eventName}$`));
      } finally {
        document.removeEventListener(eventName, noop);
      }
    });
  });

  it('getFirestore, which stays wrapped, registers a visibilitychange listener', async () => {
    const app = initializeApp(COMMON_CONFIG, rando());
    try {
      const { tasks } = await recordScheduledTasks(() => sdk.getFirestore(app));
      expect(tasks.some(task => task.startsWith('eventTask:') && task.endsWith(':visibilitychange')))
        .withContext(tasks.join(', '))
        .toBeTrue();
    } finally {
      await deleteApp(app);
    }
  });

  it('each one returns synchronously and schedules no work', async () => {
    const app = initializeApp(COMMON_CONFIG, rando());
    const unusedApp = initializeApp(COMMON_CONFIG, rando());
    try {
      const firestore = sdk.getFirestore(app);
      sdk.connectFirestoreEmulator(firestore, 'localhost', firestoreEmulatorPort);
      // The reads below start firestore's client, so calls taking an instance use one nothing has started.
      const unusedFirestore = sdk.getFirestore(unusedApp);
      const items = sdk.collection(firestore, 'unwrapped');
      const itemRef = sdk.doc(items, rando());
      await sdk.setDoc(itemRef, { a: 1 });
      const snapshot = await sdk.getDoc(itemRef);
      const aggregate = await sdk.getAggregateFromServer(items, { total: sdk.sum('a') });
      const isOne = sdk.where('a', '==', 1);
      const isPositive = sdk.where('a', '>', 0);
      const itemsQuery = sdk.query(items, isOne);
      await expectSynchronousAndTaskFree(sdk, [...UNWRAPPED_FIRESTORE_FUNCTIONS, ...UNWRAPPED_FULL_SDK_ONLY], {
        where: sdkFunction => sdkFunction('a', '==', 1),
        orderBy: sdkFunction => sdkFunction('a', 'desc'),
        limit: sdkFunction => sdkFunction(1),
        limitToLast: sdkFunction => sdkFunction(1),
        startAt: sdkFunction => sdkFunction(1),
        startAfter: sdkFunction => sdkFunction(1),
        endAt: sdkFunction => sdkFunction(1),
        endBefore: sdkFunction => sdkFunction(1),
        and: sdkFunction => sdkFunction(isOne, isPositive),
        or: sdkFunction => sdkFunction(isOne, isPositive),
        query: sdkFunction => sdkFunction(items, sdk.or(isOne, isPositive), sdk.orderBy('a'), sdk.limit(1)),
        collection: sdkFunction => sdkFunction(unusedFirestore, 'unwrapped'),
        collectionGroup: sdkFunction => sdkFunction(unusedFirestore, 'unwrapped'),
        doc: sdkFunction => sdkFunction(items),
        documentId: sdkFunction => sdkFunction(),
        increment: sdkFunction => sdkFunction(1),
        deleteField: sdkFunction => sdkFunction(),
        vector: sdkFunction => sdkFunction([1, 2, 3]),
        sum: sdkFunction => sdkFunction('a'),
        arrayRemove: sdkFunction => sdkFunction(1),
        arrayUnion: sdkFunction => sdkFunction(1),
        serverTimestamp: sdkFunction => sdkFunction(),
        maximum: sdkFunction => sdkFunction(1),
        minimum: sdkFunction => sdkFunction(1),
        average: sdkFunction => sdkFunction('a'),
        count: sdkFunction => sdkFunction(),
        memoryEagerGarbageCollector: sdkFunction => sdkFunction(),
        memoryLocalCache: sdkFunction => sdkFunction(),
        memoryLruGarbageCollector: sdkFunction => sdkFunction(),
        persistentLocalCache: sdkFunction => sdkFunction(),
        persistentMultipleTabManager: sdkFunction => sdkFunction(),
        persistentSingleTabManager: sdkFunction => sdkFunction(undefined),
        refEqual: sdkFunction => sdkFunction(itemRef, itemRef),
        queryEqual: sdkFunction => sdkFunction(itemsQuery, itemsQuery),
        snapshotEqual: sdkFunction => sdkFunction(snapshot, snapshot),
        aggregateFieldEqual: sdkFunction => sdkFunction(sdk.sum('a'), sdk.sum('a')),
        aggregateQuerySnapshotEqual: sdkFunction => sdkFunction(aggregate, aggregate),
        // 'info' is the level Firestore's logger starts at, so the call changes nothing for later specs.
        setLogLevel: sdkFunction => sdkFunction('info'),
      });
    } finally {
      await deleteApp(app);
      await deleteApp(unusedApp);
    }
  });

  it('reach callers as the SDK\'s own functions, and no others do', () => {
    expectExactlyTheseUnwrapped(angularFire, sdk, [...UNWRAPPED_FIRESTORE_FUNCTIONS, ...UNWRAPPED_FULL_SDK_ONLY]);
  });

  it('do not warn when called outside an injection context, while a wrapped function still does', async () => {
    const app = initializeApp(COMMON_CONFIG, rando());
    const warn = spyOn(console, 'warn');
    setLogLevel(LogLevel.VERBOSE);
    try {
      angularFire.where('a', '==', 1);
      angularFire.getFirestore(app);
    } finally {
      setLogLevel(isDevMode() && typeof Zone !== 'undefined' ? LogLevel.WARN : LogLevel.SILENT);
      await deleteApp(app);
    }
    const messages = warn.calls.allArgs().map(args => String(args[0]));
    expect(messages).toContain('Firebase API called outside injection context: getFirestore');
    expect(messages.filter(message => message.endsWith(': where'))).toEqual([]);
  });
});
