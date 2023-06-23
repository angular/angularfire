# AngularFire Quickstart

### 1. Create a new project

```bash
# Using yarn create
yarn create @angular <project-name>
cd <project-name>
```
or 

```bash
# Using npm create
npm create @angular <project-name>
cd <project-name>
```

optionally installing the tooling directly:
```bash
# Installing the tooling directly
npm install -g @angular/cli
ng new <project-name>
cd <project-name>
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure.

### 2. Install AngularFire and Firebase

```bash
ng add @angular/fire
```

Now that you have a new project setup, install AngularFire and Firebase from npm. This will complete the following tasks:

1. Add Firebase config to environments variables
2. Configure `@NgModule` for the `AngularFireModule`

### 3. Inject `Firestore`

Open `/src/app/app.component.ts`, and make the following changes to :

```ts
import { Component, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  firestore: Firestore = inject(Firestore);

  constructor() {

  }
}
```

### 4. Bind a Firestore collection to a list

In `/src/app/app.component.ts`:

```ts
import { Component, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  firestore: Firestore = inject(Firestore)
  items$: Observable<any[]>;

  constructor() {
    const aCollection = collection(this.firestore, 'items')
    this.items$ = collectionData(aCollection);
  }
}
```

Open `/src/app/app.component.html`:

```html
<ul>
  <li class="text" *ngFor="let item of items$ | async">
    {{item.name}}
  </li>
</ul>
```

### 5. Run your app locally

```bash
ng serve
```

Your Angular app will compile and serve locally, visit it we should find an empty list.

In another tab [start adding data to an `items` collection in Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data). *As we're not authenticating users yet, be sure to start Firestore in **test mode** or allow reading from the `items` collection in Security Rules (`allow read: if true`).*

Once you've created a `items` collection and are inserting documents, you should find data streaming into your Angular application and being rendered in your browser.

### 6. Deploy your app

Finally, we can deploy the application to Firebase hosting:

```bash
ng deploy
```
