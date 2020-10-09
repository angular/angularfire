import { firestore } from 'firebase/app';
import { AngularFirestoreCollection } from './collection/collection';

export interface Stock {
  name: string;
  price: number;
}

export const FAKE_STOCK_DATA = { name: 'FAKE', price: 1 };

export const randomName = (firestore): string => firestore.collection('a').doc().id;

export const createRandomStocks = async (firestore: firestore.Firestore, collectionRef: firestore.CollectionReference, numberOfItems) => {
  // Create a batch to update everything at once
  const batch = firestore.batch();
  // Store the random names to delete them later
  const count = 0;
  let names: string[] = [];
  Array.from(Array(numberOfItems)).forEach((a, i) => {
    const name = randomName(firestore);
    batch.set(collectionRef.doc(name), FAKE_STOCK_DATA);
    names = [...names, name];
  });
  // Create the batch entries
  // Commit!
  await batch.commit();
  return names;
};

export function deleteThemAll(names, ref) {
  const promises = names.map(name => ref.doc(name).delete());
  return Promise.all(promises);
}

export function delayUpdate<T>(collection: AngularFirestoreCollection<T>|firestore.CollectionReference, path, data, delay = 250) {
  setTimeout(() => {
    collection.doc(path).update(data);
  }, delay);
}

export function delayAdd<T>(collection: AngularFirestoreCollection<T>|firestore.CollectionReference, path, data, delay = 250) {
  setTimeout(() => {
    collection.doc(path).set(data);
  }, delay);
}

export function delayDelete<T>(collection: AngularFirestoreCollection<T>|firestore.CollectionReference, path, delay = 250) {
  setTimeout(() => {
    collection.doc(path).delete();
  }, delay);
}

export const rando = () => (Math.random() + 1).toString(36).substring(7);
