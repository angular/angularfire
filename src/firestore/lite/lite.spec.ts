import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import * as angularFire from '@angular/fire/firestore/lite';
import { Firestore, connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore/lite';
import { deleteApp, initializeApp as initializeSdkApp } from 'firebase/app';
import * as sdk from 'firebase/firestore/lite';
import { COMMON_CONFIG, firestoreEmulatorPort } from '../../test-config';
import { rando } from '../../utils';
import { UNWRAPPED_FIRESTORE_FUNCTIONS, expectExactlyTheseUnwrapped, expectSynchronousAndTaskFree } from '../zone-wrap-spec-support';

describe('Firestore-lite', () => {
  let app: FirebaseApp;
  let firestore: Firestore;
  let providedFirestore: Firestore;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideFirestore(() => {
                    providedFirestore = getFirestore(getApp(appName));
                    connectFirestoreEmulator(providedFirestore, 'localhost', firestoreEmulatorPort);
                    return providedFirestore;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        firestore = TestBed.inject(Firestore);
    });

    it('should be injectable', () => {
        expect(providedFirestore).toBeTruthy();
        expect(firestore).toEqual(providedFirestore);
        expect(firestore.app).toEqual(app);
    });

  });

});

// Lite is a separate bundle with its own function objects, so the full SDK's test does not cover it.
describe('Firestore Lite functions re-exported without the zone wrapper', () => {

  it('each one returns synchronously and schedules no work', async () => {
    const sdkApp = initializeSdkApp(COMMON_CONFIG, rando());
    const unusedSdkApp = initializeSdkApp(COMMON_CONFIG, rando());
    try {
      const firestore = sdk.getFirestore(sdkApp);
      sdk.connectFirestoreEmulator(firestore, 'localhost', firestoreEmulatorPort);
      // The reads below start firestore's client, so calls taking an instance use one nothing has started.
      const unusedFirestore = sdk.getFirestore(unusedSdkApp);
      const items = sdk.collection(firestore, 'unwrapped-lite');
      const itemRef = sdk.doc(items, rando());
      await sdk.setDoc(itemRef, { a: 1 });
      const snapshot = await sdk.getDoc(itemRef);
      const aggregate = await sdk.getAggregate(items, { total: sdk.sum('a') });
      const isOne = sdk.where('a', '==', 1);
      const isPositive = sdk.where('a', '>', 0);
      const itemsQuery = sdk.query(items, isOne);
      await expectSynchronousAndTaskFree(sdk, UNWRAPPED_FIRESTORE_FUNCTIONS, {
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
        collection: sdkFunction => sdkFunction(unusedFirestore, 'unwrapped-lite'),
        collectionGroup: sdkFunction => sdkFunction(unusedFirestore, 'unwrapped-lite'),
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
        refEqual: sdkFunction => sdkFunction(itemRef, itemRef),
        queryEqual: sdkFunction => sdkFunction(itemsQuery, itemsQuery),
        snapshotEqual: sdkFunction => sdkFunction(snapshot, snapshot),
        aggregateFieldEqual: sdkFunction => sdkFunction(sdk.sum('a'), sdk.sum('a')),
        aggregateQuerySnapshotEqual: sdkFunction => sdkFunction(aggregate, aggregate),
        // 'info' is the level Firestore's logger starts at, so the call changes nothing for later specs.
        setLogLevel: sdkFunction => sdkFunction('info'),
      });
    } finally {
      await deleteApp(sdkApp);
      await deleteApp(unusedSdkApp);
    }
  });

  it('reach callers as the SDK\'s own functions, and no others do', () => {
    expectExactlyTheseUnwrapped(angularFire, sdk, UNWRAPPED_FIRESTORE_FUNCTIONS);
  });
});
