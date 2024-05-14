<img align="right" width="30%" src="images/firestore-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Realtime Cloud Firestore
</small>

# Cloud Firestore

Cloud Firestore is a flexible, scalable NoSQL database for mobile, web, and server development from Firebase and Google Cloud. It keeps your data in sync across client apps through realtime listeners and offers offline support for mobile and web so you can build responsive apps that work regardless of network latency or Internet connectivity. 

[Learn more](https://firebase.google.com/docs/firestore)

Cloud Firestore is the API that gives your application access to your database in the cloud or locally in your [emulator](https://firebase.google.com/docs/emulator-suite).

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```
Provide a Firestore instance in the application's `NgModule` (`app.module.ts`):

```typescript
@NgModule({
  declarations: [
    ...
  ],
  imports: [
    ...
    // App initialization
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```


In your component class, for example `user-profile.component.ts` import and inject `Firestore`:

```typescript
import { Component, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';

@Component({
    standalone: true,
    selector: 'app-user-profile',
    ...
})
export class UserProfileComponent {
    private firestore: Firestore = inject(Firestore);
    ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/firestore'` to `import { ... } from '@angular/fire/firestore'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/firestore/quickstart#web-modular-api) | [API Reference](https://firebase.google.com/docs/reference/js/firestore)

### Reading data

In Cloud Firestore data is stored in `documents` and `documents` are stored in `collections`. The path to data follows `<collection_name>/<document_id>` and continues if there are subcollections. For example, `"users/ABC12345/posts/XYZ6789"` represents:
* `users` collection
* document id `ABC12345`
* `posts` collection
* document id `XYZ6789`


Let's explore reading data in Angular using the `collection` and `collectionData` functions.

In `user-profile.component.ts`:

```typescript
import { Firestore, collection, collectionData} from '@angular/fire/firestore';
import { Component, inject } from '@angular/core';

@Component ({
    selector: 'app-user-profile',
    standalone: true,
    ...
})
export class UserProfileComponent {
    private firestore: Firestore = inject(Firestore); // inject Cloud Firestore
    users$: Observable<UserProfile[]>;

    constructor() {
        // get a reference to the user-profile collection
        const userProfileCollection = collection(this.firestore, 'users');

        // get documents (data) from the collection using collectionData
        this.users$ = collectionData(userProfileCollection) as Observable<UserProfile[]>;
    }
}
export Interface UserProfile {
    username: string;
}
```
`collectionData` returns an `observable` that can we can use to display the data in the template. In `user-profile.component.html`:

```html
    <section>
        <h1>User Profiles</h1>
        <ul>
            <li *ngFor="let user of users$ | async">
                {{user.username}}
            </li>
        </ul>
    </section>
```

The `async` pipe handles unsubscribing from observables.

### Writing data

To write to Cloud Firestore use the `addDoc` function. It will create a new document at the path specified by the collection. In `user-profile.component.ts`, we'll update the code to add a new document on a `<button>` click.


```typescript
import { Firestore, collection, collectionData, addDoc} from '@angular/fire/firestore';
import { Component, inject } from '@angular/core';

@Component ({
    selector: 'app-user-profile',
    standalone: true,
    ...
})
export class UserProfileComponent {
    private firestore: Firestore = inject(Firestore); // inject Cloud Firestore
    users$: Observable<UserProfile[]>;
    usersCollection: CollectionReference;
    
    constructor() {...}

    addUserProfile(username: string) {
        if (!username) return;

        addDoc(this.usersCollection, <UserProfile> { username }).then((documentReference: DocumentReference) => {
            // the documentReference provides access to the newly created document
        });
    }
}
export Interface UserProfile {
    username: string;
}
```
In the `addUserProfile` method we use a reference to the `this.usersCollection` and provide `UserProfile` data to the the `addDoc` function. `addDoc` returns a promise that can be used to respond to the successful addition of the data. Errors can also be caught here.

## Learn More
More information on API methods and other functions can be found on the [Firebase Official Docs](https://firebase.google.com/docs/reference/js/firestore_)
