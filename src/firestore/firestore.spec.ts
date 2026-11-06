import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  Firestore,
  FirestoreDataConverter,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  provideFirestore,
  setDoc,
} from '@angular/fire/firestore';
import { COMMON_CONFIG, firestoreEmulatorPort } from '../test-config';
import { rando } from '../utils';

/* A model class with a method that shares a name with an observer member, saved through a converter. */
class Task {
  constructor(public title: string) {}
  complete() {
    return this.title;
  }
}

const taskConverter: FirestoreDataConverter<Task> = {
  toFirestore: task => ({ title: Reflect.get(task, 'title'), wasTaskInstance: task instanceof Task }),
  fromFirestore: snapshot => new Task(String(snapshot.get('title'))),
};

describe('Firestore', () => {
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

    it('setDoc hands a converter the model instance itself and releases its pending task', async () => {
        const pendingTasks = TestBed.inject(PendingTasks);
        const originalAdd = pendingTasks.add.bind(pendingTasks);
        let added = 0;
        let released = 0;
        spyOn(pendingTasks, 'add').and.callFake(() => {
            added++;
            const remove = originalAdd();
            return () => {
                released++;
                remove();
            };
        });
        const ref = TestBed.runInInjectionContext(() => doc(firestore, `tasks/${rando()}`)).withConverter(taskConverter);
        await TestBed.runInInjectionContext(() => setDoc(ref, new Task('write the spec')));
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(added).toBe(1);
        expect(released).toBe(1);
        const stored = await TestBed.runInInjectionContext(() => getDoc(doc(firestore, ref.path)));
        expect(stored.get('wasTaskInstance')).toBeTrue();
    });

  });

});
