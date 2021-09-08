import {
    collection, query, orderBy, fromRef,
    updateDoc, doc, increment, serverTimestamp, addDoc, SetOptions,
    DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp
} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { firestore } from '../getFirestore';

export class Animal {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly upboats: number,
        public readonly updatedAt: Timestamp,
        public readonly hasPendingWrites: boolean,
        public readonly fromCache: boolean,
    ) { }
    static toFirestore({ name, upboats }: Animal, options?: SetOptions): DocumentData {
        return { name, upboats, updatedAt: serverTimestamp() };
    }
    static fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): Animal|undefined {
        const { name, upboats, updatedAt } = snapshot.data();
        if (typeof name === 'string' && typeof upboats === 'number' && typeof updatedAt === 'object') {
            return new Animal(
                snapshot.id,
                name,
                upboats,
                updatedAt,
                snapshot.metadata.hasPendingWrites,
                snapshot.metadata.fromCache,
            );
        } else {
            return undefined;
        }
    }
}

const animalsCollection = collection(firestore, 'animals').withConverter(Animal);
const animalsQuery = query(animalsCollection, orderBy('upboats', 'desc'), orderBy('updatedAt', 'desc'));

export const snapshotChanges = fromRef(animalsQuery, { includeMetadataChanges: true }).pipe(
    map(it =>
        it.docs.
            map(change => change.data()).
            filter(it => !!it).
            map((it: any) => it as Animal) // TODO filter, why your type so bad?
    )
);

export const upboat = async (id: string) => {
    return await updateDoc(doc(firestore, `animals/${id}`), {
        upboats: increment(1),
        updatedAt: serverTimestamp(),
    });
};

export const downboat = async (id: string) => {
    return await updateDoc(doc(firestore, `animals/${id}`), {
      upboats: increment(-1),
      updatedAt: serverTimestamp(),
    });
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
