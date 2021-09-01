import {
    collection, query, orderBy, collectionChanges as _collectionChanges, fromRef,
    updateDoc, doc, increment, serverTimestamp, addDoc
} from '@angular/fire/firestore';
import { map, tap } from 'rxjs/operators';
import { firestore } from '../getFirestore';
import { Animal } from './upboats.component';

const animalsCollection = collection(firestore, 'animals');
const animalsQuery = query(animalsCollection, orderBy('upboats', 'desc'), orderBy('updatedAt', 'desc'));

export const snapshotChanges = fromRef(animalsQuery, { includeMetadataChanges: true }).pipe(
    map(it => it.docs.map(change => ({
        ...change.data(),
        id: change.id,
        hasPendingWrites: change.metadata.hasPendingWrites
    } as Animal)))
);

export const collectionChanges = _collectionChanges(animalsQuery).pipe(
    tap(it => console.log(it))
);

export const upboat = async (id: string) => {
    // TODO add rule
    return await updateDoc(doc(firestore, `animals/${id}`), {
        upboats: increment(1),
        updatedAt: serverTimestamp(),
    });
};

export const downboat = async (id: string) => {
    // TODO add rule
    return await updateDoc(doc(firestore, `animals/${id}`), {
      upboats: increment(-1),
      updatedAt: serverTimestamp(),
    });
};

export const newAnimal = async () => {
    // TODO add rule
    return await addDoc(collection(firestore, 'animals'), {
      name: prompt('Can haz name?'),
      upboats: 1,
      updatedAt: serverTimestamp(),
    });
};
