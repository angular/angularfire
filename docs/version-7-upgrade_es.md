# Actualizando a AngularFire 7.0

Diseñado para ejecutarse con Angular 12, AngularFire 7.0 le permite aprovechar al máximo el nuevo Firebase JS SDK (v9) tree-shakable, al mismo tiempo, proporciona una experiencia compatible con la API anterior.

`ng update @angular/fire`

## Breaking changes

* Angular 12 es requerido
* AngularFire ahora solo funciona en aplicaciones con Ivy.
* Firebase JS SDK v9 es requerido
* La API AngularFire v6 existente se ha movido de `@angular/fire/*` a `@angular/fire/compat/*` (ver modo de compatibilidad)
* **compat/auth:** El token `USE_EMULATOR` para DI ahora esta en el formulario de `['http://localhost:9099']`

## Modo de compatibilidad

AngularFire v7.0 tiene una capa de compatibilidad que admite la API de AngularFire v6.0. Simplemente cambie sus imports de `@angular/fire/*` a `@angular/fire/compat/*` y `firebase/*` a `firebase/compat/*`.

Si bien no es tan variable como el nuevo SDK modular, esto le permite actualizar y aprovechar los beneficios del nuevo SDK lo antes posible.

**La mayoría de los desarrolladores pueden detenerse aquí por ahora, ya que la nueva API no está completa.**

## **NUEVO** SDK Modular

### Inicialización

Para admitir mejor la capacidad tree-shakability introducida en Firebase v9 y reducir el mantenimiento requerido cuando el SDK de JS agrega nuevos indicadores de configuración, los "providers" de AngularFire ahora toman una "factory" para una instancia completa del SDK que le gustaría inyectar.

**Antes:**
```ts
@NgModule({
    imports: [
        AngularFireModule.initializeApp(config),
        AngularFirestoreModule.enablePersistence(),
        AngularFireStorageModule,
    ],
    providers: [
        { provide: USE_EMULATOR, useValue: ['localhost', 8080] },
    ],
})
```

**SDK Modular:**
```ts
@NgModule({
    imports: [
        provideFirebaseApp(() => initializeApp(config)),
        provideFirestore(() => {
            const firestore = getFirestore();
            connectFirestoreEmulator(firestore, 'localhost', 8080);
            enableIndexedDbPersistence(firestore);
            return firestore;
        }),
        provideStorage(() => getStorage()),
    ],
})
```

### Inyectando servicios

Antes, cuando inyectaba los servicios SDK de Firebase JS en AngularFire, se cargaban de forma diferida y se le devolvía un "promise-proxy. En AngularFire v7 obtienes el servicio iniciado directamente. Ya no cargamos de manera "lazy" por ti.

```ts
import { Firestore, doc, onSnapshot, DocumentReference, docSnapshots } from '@angular/fire/firestore';

@Component({})
export class Foo {
    doc: DocumentReference;
    constructor(
        firestore: Firestore, // Injects the instantiated Firestore instance
    ) {
        // You can directly operate on the instance with JS SDK methods which we've
        // reexported in AngularFire
        this.doc = doc(firestore, 'foo/1');
        onSnapshot(doc, snap => {
            // ...
        });
        // or use the convenience observables
        docSnapshots(doc).subscribe(...);
    }
    async update() {
        await updateDoc(this.doc, { ... });
        ...
    }
}
```

### Trabajando con multiple apps / instances

En AngularFire v7, trabajar con múltiples instancias fue difícil, en el nuevo SDK tenemos nuevos tokens DI que hacen que trabajar con ellos sea mucho más sencillo.

```ts
@NgModule({
    imports: [
        provideFirebaseApp(() => initializeApp(config)),
        provideFirebaseApp(() => initializeApp(config2, 'anotherApp')),
        provideStorage(() => getStorage()),
        provideStorage(() => getStorage(getApp(), 'anotherBucket')),
        provideStorage(() => getStorage(getApp('anotherApp'))),
    ],
})
```

```ts
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Storage, StorageInstances } from '@angular/fire/storage';

export class Foo {
    constructor(
        defaultApp: FirebaseApp,       // Injects the default FirebaseApp
        allFirebaseApps: FirebaseApps, // Injects an array of all initialized Firebase Apps
        storage: Storage,                      // Injects the default storage instance
        allStorageInstances: StorageInstances, // Injects an array of all the intialized storage instances
    ) { }
}
```

Cómo han cambiado las funciones de los principales tokens de inyección (es decir, `FirebaseApp`, `Storage`) desde v7, pero debería proporcionar una API mucho más poderosa e intuitiva.

### API

Más allá de la inyección de dependencia AngularFire presenta una API completamente nueva:

1) Ya no manejamos la carga diferida de los módulos SDK de Firebase JS por usted
1) Ya no brindamos clases más allá de la inyección de dependencia
1) No más Proxy / Promise-Proxy
1) Reexportamos y empaquetamos en zonas todas las API de Firebase y RxFire

Por lo tanto, desarrollar con el nuevo AngularFire es fácil, puede usarlo como el SDK estándar de Firebase JS. Simplemente cambie todas sus importaciones de `firebase/app` a `@angular/fire/app`, `firebase/firestore` a `@angular/fire/firestore`, `firebase/database` a `@angular/fire/database`, etc. Entonces, si se siente cómodo con RXJS y le gustaría usar algunos de nuestros operadores de conveniencia, puede sumergirse en esa caja de herramientas.

#### Alternatives to v6 APIs

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
import { doc } from '@angular/fire/firestore';
doc<T>(firestore, 'foo/bar') // DocumentReference<T>
```
</td>
        </tr>
        <tr>
            <td>collection</td>
            <td>

```ts
import { collection } from '@angular/fire/firestore';
collection<T>(firestore, 'foo') // CollectionReference<T>
```
</td>
        </tr>
        <tr>
            <td>collectionGroup</td>
            <td>

```ts
import { collectionGroup } from '@angular/fire/firestore';
collectionGroup<T>(firestore, 'foo') // Query<T>
```
</td>
        </tr>
        <tr>
            <th rowspan="7">AngularFirestoreDocument</th>
            <td>set</td>
            <td>

```ts
import { setDoc } from '@angular/fire/firestore';
setDoc(docRef, { ... }) // Promise<void>
```
</td>

</td>
        </tr>
        <tr>
            <td>update</td>
            <td>

```ts
import { updateDoc } from '@angular/fire/firestore';
updateDoc(docRef, { ... }) // Promise<void>
```
</td>
        </tr>
        <tr>
            <td>delete</td>
            <td>

```ts
import { deleteDoc } from '@angular/fire/firestore';
deleteDoc(docRef) // Promise<void>
```
</td>
        </tr>
        <tr>
            <td>collection</td>
            <td>

```ts
import { collection } from '@angular/fire/firestore';
collection<T>(docRef, 'bar') // CollectionReference<T>
```
</td>
        </tr>
        <tr>
            <td>snapshotChanges</td>
            <td>

```ts
import { docSnapshots } from '@angular/fire/firestore';
docSnapshots<T>(docRef) // Observable<DocumentSnapshot<T>>
```
</td>

</td>
        </tr>
        <tr>
            <td>valueChanges</td>
            <td>

```ts
import { docData } from '@angular/fire/firestore';
docData<T>(docRef) // Observable<T>
```
</td>
        </tr>
        <tr>
            <td>get</td>
            <td>

```ts
import { getDoc } from '@angular/fire/firestore';
getDoc<T>(docRef) // Promise<DocumentSnapshot<T>>
```

</td>
        </tr>
    </tbody>
</table>

### "Code splitting " y "lazy-loading"

AngularFire ya no realiza la carga diferida de los servicios. Hemos proporcionado un asistente observable para detectar cuándo se crea una nueva instancia de servicio. En este ejemplo, dividiremos el código de todo el código relacionado con Firestore y la carga diferida

```ts
// firestore_operations.ts
import {
    collectionData,
    firestoreInstance$,
    collection,
    getFirestore
} from '@angular/fire/firestore';
import { first } from 'rxjs/operators';
import { IFoo } from '../interfaces';

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