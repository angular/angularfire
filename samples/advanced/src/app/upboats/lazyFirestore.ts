import { NgZone, makeStateKey, TransferState } from '@angular/core';
import { pendingUntilEvent } from '@angular/core/rxjs-interop';
import {
    DocumentData,
    LoadBundleTaskProgress,
    QueryDocumentSnapshot,
    SetOptions,
    SnapshotOptions,
    addDoc,
    collection,
    doc,
    fromRef,
    increment,
    loadBundle,
    namedQuery,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from '@angular/fire/firestore';

import type { firestore as adminFirestore, app } from 'firebase-admin';
import { Observable, from, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { firestore } from '../getFirestore';

function isClientSnapshot(snap: QueryDocumentSnapshot|adminFirestore.QueryDocumentSnapshot): snap is QueryDocumentSnapshot {
    return (snap as QueryDocumentSnapshot).metadata !== undefined;
}

export class Animal {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly upboats: number,
        public readonly hasPendingWrites: boolean,
        public readonly fromCache: boolean,
        public readonly _VALID: boolean,
    ) { }

    static toFirestore({ name, upboats }: Animal, options?: SetOptions): DocumentData {
        return { name, upboats, updatedAt: serverTimestamp() };
    }

    static fromFirestore(snapshot: QueryDocumentSnapshot|adminFirestore.QueryDocumentSnapshot, options?: SnapshotOptions) {
        let { name, upboats } = snapshot.data();
        let valid = true;
        if (typeof name !== 'string') { name = ''; valid = false; }
        if (typeof upboats !== 'number') { upboats = 0; valid = false; }
        return new Animal(
            snapshot.id,
            name,
            upboats,
            isClientSnapshot(snapshot) ? snapshot.metadata.hasPendingWrites : false,
            isClientSnapshot(snapshot) ? snapshot.metadata.fromCache : true,
            valid,
        );
    }

    async upboat() {
        return await updateDoc(doc(firestore, `animals/${this.id}`), {
            upboats: increment(1),
            updatedAt: serverTimestamp(),
        });
    }

    async downboat() {
        return await updateDoc(doc(firestore, `animals/${this.id}`), {
            upboats: increment(-1),
            updatedAt: serverTimestamp(),
        });
    }

}


export const snapshotChanges = (state: TransferState, zone: NgZone, admin: app.App|undefined): Observable<Animal[]> => {
    const key = makeStateKey<string>('ANIMALS-FIRESTORE-BUNDLE');
    const queryName = 'animals';
    if (admin) {
        const firestore = zone.runOutsideAngular(() => admin.firestore());
        const animalsCollection = firestore.
            collection('animals').
            orderBy('upboats', 'desc').
            orderBy('updatedAt', 'desc').
            withConverter(Animal);
        return from(zone.runOutsideAngular(() => animalsCollection.get())).pipe(
            pendingUntilEvent(),
            tap((it: any) => {
                const bundle = firestore.bundle().add(queryName, it).build();
                state.set(key, bundle.toString());
            }),
            map((it: any) =>
                it.docs.
                    map((change: any) => change.data()).
                    filter((it: any) => it._VALID)
            )
        );
    } else {
        const animalsCollection = collection(firestore, 'animals');
        const animalsQuery = query(animalsCollection, orderBy('upboats', 'desc'), orderBy('updatedAt', 'desc'));
        const bundle = state.get(key, undefined);
        const base$: Observable<any> = bundle ?
            new Observable<LoadBundleTaskProgress>(sub => {
                const task = loadBundle(firestore, bundle);
                task.onProgress(next => sub.next(next), err => sub.error(err), () => sub.complete());
            }).pipe(
                filter(it => it.taskState === 'Success')
            ) :
            of(undefined);
        return base$.pipe(
            switchMap(() => namedQuery(firestore, queryName)),
            map(namedQuery => namedQuery || animalsQuery),
            map(query => query.withConverter(Animal)),
            switchMap(query => fromRef(query, { includeMetadataChanges: true })),
            map(it =>
                it.docs.
                    map(change => change.data()).
                    filter(it => it._VALID)
            )
        );
    }
};

export const newAnimal = async () => {
    const name = prompt('Can haz name?');
    if (!name) { throw new Error('that\'s no name'); }
    return await addDoc(collection(firestore, 'animals'), {
      name,
      upboats: 1,
      updatedAt: serverTimestamp(),
    });
};
