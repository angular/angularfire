import { TestBed } from '@angular/core/testing';
import { AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';

export interface Stock {
  name: string;
  price: number;
}

export const FAKE_STOCK_DATA = { name: 'FAKE', price: 1 };

export const randomName = (firestore): string => firestore.collection('a').doc().id;

export const createRandomStocks = async (
  firestore: firebase.firestore.Firestore,
  collectionRef: firebase.firestore.CollectionReference,
  numberOfItems
) => {
  // Create a batch to update everything at once
  const batch = TestBed.runInInjectionContext(() => firestore.batch());
  // Store the random names to delete them later
  let names: string[] = [];
  Array.from(Array(numberOfItems)).forEach(() => {
    const name = randomName(firestore);
    TestBed.runInInjectionContext(() => batch.set(collectionRef.doc(name), FAKE_STOCK_DATA));
    names = [...names, name];
  });
  // Create the batch entries
  // Commit!
  await TestBed.runInInjectionContext(() => batch.commit());
  return names;
};

export function deleteThemAll(names, ref) {
  const promises = names.map(name => ref.doc(name).delete());
  return Promise.all(promises);
}

export function delayUpdate<T>(collection: AngularFirestoreCollection<T>|firebase.firestore.CollectionReference, path, data, delay = 250) {
  setTimeout(() => {
    TestBed.runInInjectionContext(() => collection.doc(path).update(data));
  }, delay);
}

export function delayAdd<T>(collection: AngularFirestoreCollection<T>|firebase.firestore.CollectionReference, path, data, delay = 250) {
  setTimeout(() => {
    TestBed.runInInjectionContext(() => collection.doc(path).set(data));
  }, delay);
}

export function delayDelete<T>(collection: AngularFirestoreCollection<T>|firebase.firestore.CollectionReference, path, delay = 250) {
  setTimeout(() => {
    TestBed.runInInjectionContext(() => collection.doc(path).delete());
  }, delay);
}
