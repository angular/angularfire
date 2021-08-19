# Upgrading to AngularFire 7.0

Intended to be run with Angular 12, AngularFire 7.0 allows you to take full advtange of the new tree-shakable Firebase JS SDK (v9) while also providing a compatible expirience with the prior API.

`ng update @angular/fire --next`

## Breaking changes

* Angular 12 is required
* AngularFire now only works in Ivy applications
* Firebase JS SDK v9 is required
* The AngularFire v6 API surface has moved from `@angular/fire/*` to `@angular/fire/compat/*` (see compatibility mode)

## Compatibility mode

AngularFire v7.0 has a compatibility layer that supports the AngularFire v6.0 API. Just change your imports from `@angular/fire/*` to `@angular/fire/compat/*` and `firebase/*` to `firebase/compat/*`.

While not as tree-shakable as the new modular SDK, this allows you to upgrade and take advantage of the benefits of the new SDK ASAP.

## Modular SDK

### Initialization

In order to better support the tree-shakability introduced in Firebase v9 & to reduce the maintence required when the JS SDK adds new configuration flags, AngularFire providers now take a factory for a fully instantiated instance of the SDK you'd like to inject.

**Before:**
```ts
@NgModule({
    imports: [
        AngularFire.initalizeApp(config),
        AngularFirestoreModule.enablePersistence(),
        AngularFireStorageModule,
    ],
    providers: [
        { provide: USE_EMULATOR, useValue: ['localhost', 8080] },
    ],
})
```

**Modular SDK:**
```ts
@NgModule({
    imports: [
        provideFirebaseApp(() => initializeApp(config)),
        provideFirestore(() => {
            const firestore = getFirestore();
            connectEmulator(firestore, 'localhost', 8080);
            enableIndexedDbPersistence(firestore);
            return firestore;
        }),
        provideStorage(() => getStorage()),
    ],
})
```

### Injecting services

Before when you injected Firebase JS SDK services into AngularFire they would be lazy-loaded and a promise-proxy would be returned to you. In AngularFire v7 you get the intiated service directly. We no longer lazy load for you.

```ts
import { FirebaseApp } from '@angular/fire';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';

@Component({})
export class Foo {
    constructor(
        app: FirebaseApp,
        firestore: Firestore, // Injects the instantiated Firestore instance
    ) {
        // You can directly operate on the instance with the JS SDK or use our "reexported"
        // API calls for Zone.js wrapping
        onSnapshot(doc(firestore, 'foo/1'), snap => {
            // ...
        });
    }
}
```

### Class methods

AngularFire no longer provides observables and functions as class methods, everthing is a implemented as a pure function that can be tree-shaken.

<table>
    <thead>
        <tr>
            <th colspan="2">v6 / Compat</th>
            <th>v7 Modular</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th rowspan="3">AngularFirestore</th>
            <td>doc</td>
            <td>

```ts
import { doc } from '@angular/fire/firestore'
```
</td>
        </tr>
        <tr>
            <td>collection</td>
            <td>

```ts
import { collection } from '@angular/fire/firestore'
```
</td>
        </tr>
        <tr>
            <td>collectionGroup</td>
            <td>

```ts
import { collectionGroup } from '@angular/fire/firestore'
```
</td>
        </tr>
        <tr>
            <th rowspan="7">AngularFirestoreDocument</th>
            <td>set</td>
            <td>

```ts
import { setDoc } from '@angular/fire/firestore'
```
</td>

</td>
        </tr>
        <tr>
            <td>update</td>
            <td>

```ts
import { updateDoc } from '@angular/fire/firestore'
```
</td>
        </tr>
        <tr>
            <td>delete</td>
            <td>

```ts
import { deleteDoc } from '@angular/fire/firestore'
```
</td>
        </tr>
        <tr>
            <td>collection</td>
            <td>

```ts
import { collection } from '@angular/fire/firestore'
```
</td>
        </tr>
        <tr>
            <td>snapshotChanges</td>
            <td>

```ts
import { docSnapshots } from '@angular/fire/firestore'
```
</td>

</td>
        </tr>
        <tr>
            <td>valueChanges</td>
            <td>

```ts
import { docData } from '@angular/fire/firestore'
```
</td>
        </tr>
        <tr>
            <td>get</td>
            <td>

```ts
import { get } from '@angular/fire/firestore'
```

</td>
        </tr>
        <tr>
            <td rowspan="7">
                <h4>AngularFirestoreCollection</h4>
                <p><small>Notes</small></p>
            </td>
            <td>a</td>
<td>

```ts
import { collectionGroup } from 'firebase/firestore'
```
</td>
        </tr>
        <tr>
            <td>a</td>
<td>

```ts
import { collectionGroup } from 'firebase/firestore'
```
</td>
        </tr>
        <tr>
            <td>a</td>
<td>

```ts
import { collectionGroup } from 'firebase/firestore'
```
</td>
        </tr>
        <tr>
            <td>a</td>
<td>

```ts
import { collectionGroup } from 'firebase/firestore'
```
</td>
        </tr>
        <tr>
            <td>a</td>
<td>

```ts
import { collectionGroup } from 'firebase/firestore'
```
</td>
        </tr>
        <tr>
            <td>a</td>
<td>

```ts
import { collectionGroup } from 'firebase/firestore'
```
</td>
        </tr>
        <tr>
            <td>a</td>
<td>

```ts
import { collectionGroup } from 'firebase/firestore'
```
</td>
        </tr>
    </tbody>
</table>

### Code splitting and lazy-loading

AngularFire does not lazy-load services any longer. We have provided a helper observable for detecting when a new service instance is instantiated. In this example we'll code split out of all the Firestore related code and lazy-load

```ts
// firestore_operations.ts
import {
    collectionData,
    firestoreInstance$,
    collection,
    getFirestore
} from '@angular/fire/firestore';
import { first } from 'rxjs/operators';

export { getFirestore };

export const fooData = firestoreInstance$.pipe(
    first(),
    concatMap(firestore => collectionData<IFoo>(collection(firestore, 'foo'))),
);
```

```ts
export class AuthService {
    constructor() {
        getRedirectResult().then(result => {
            // Initialize Firestore only after a user logs in
            if (result.user) {
                const { getFirestore } = await import('./firestore_operations');
                getFirestore();
            }
        });
    }
}
```

```ts
@Component({})
export class Foo {
    data: Observable<IFoo[]>;
    constructor() {
        this.data = of(undefined).pipe(
            concatMap(() => import('./firestore_operations')),
            concatMap(it => it.fooData)
        );
    }
}
```

### Working with multiple apps / instances

In AngularFire v7 working with multiple instances was difficult, in the new SDK we have new DI tokens that make working with them much more straight forward.

```ts
@NgModule({
    imports: [
        provideFirebaseApp(() => initializeApp(config)),
        provideFirebaseApp(() => initializeApp(config2, 'anotherApp')),
        provideStorage(() => getStorage(getApp())),
        provideStorage(() => getStorage(getApp(), 'another bucket')),
        provideStorage(() => getStorage(getApp('anotherApp'))),
    ],
})
```

```ts
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Storage, StorageIsntances } from '@angular/fire/storage';

export class Foo {
    constructor(
        defaultApp: FirebaseApp, // Injects the default FirebaseApp
        firebaseApps: FirebaseApps, // Injects an array of all initialized Firebase Apps
        storage: Storage, // Injects the default FirebaseApp's default storage instance
        storageInstances: StorageInstances, // Injects an array of all the intialized storage instances
    ) { }
}
```
How the main injection tokens (i.e, `FirebaseApp`, `Storage`) function have changed from v7 but it should provide a much more powerful and intuitive API.