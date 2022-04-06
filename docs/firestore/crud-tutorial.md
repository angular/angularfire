Updated April 6, 2022.

# AngularFire CRUD Tutorial: "Greatest Computer Scientists"

### 1. Create a new project

In your terminal:

```bash
npm install -g @angular/cli
ng new GreatestComputerScientists
cd GreatestComputerScientists
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure. Accept the defaults (no routing, CSS). Start the server:

```bash
ng serve
```

Open a browser to `localhost:4200`. You should see the Angular default homepage.

### 2. Install AngularFire and Firebase

Install AngularFire and Firebase from npm.

```bash
ng add @angular/fire
```

Deselect `ng deploy -- hosting` and select `Firestore`. This project won't use any other Firebase features.

```bash
npm install firebase
```

### 3. Create your Firebase project and add Firebase config to environments variable

Open your Firebase console and make a new project. Call it GreatestComputerScientists.

Open `/src/environments/environment.ts` and add your Firebase configuration. You can find your project configuration in your [Firebase Console](https://console.firebase.google.com). Click the Gear icon next to Project Overview, in the Your Apps section, create a new app and choose the type Web. Give the app a name and copy the config values provided to your `environment.ts` file:

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: '<your-key>',
    authDomain: '<your-project-authdomain>',
    databaseURL: '<your-database-URL>',
    projectId: '<your-project-id>',
    storageBucket: '<your-storage-bucket>',
    messagingSenderId: '<your-messaging-sender-id>',
    appId: '<your-app-id>',
    measurementId: '<your-measurement-id>'
  }
};
```

### 4. Setup `@NgModule` for the `AngularFireModule`

Open `/src/app/app.module.ts`, inject the Firebase and environment modules, and import your Firebase configuration.

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

// Firebase
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Keep an eye on the browser. If the homepage crashes, go back and see what's wrong.

### 5. Setup individual `@NgModule`s

After adding the AngularFireModule you also need to add modules to `app.module.ts` for the individual @NgModules that your application needs.

This application uses the Firestore database. Add `AngularFirestoreModule`. We'll also need the Angular `FormsModule`.

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

// Angular
import { FormsModule } from '@angular/forms';

// Firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 6. Inject `AngularFirestore` into Component Controller

Open `/src/app/app.component.ts` and import `AngularFirestore`. In the `constructor` make a local variable for `AngularFirestore`.

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'GreatestComputerScientists';

  constructor(public firestore: AngularFirestore) {}
}
```

The constructor makes an instantiation of the `AngularFirestore` class and we call it `firestore` for convenience and clarity. You must specify this as `public`, `protected`, or `private`. It doesn't matter which, they all work. It won't work if you don't specify one of these:

```ts
  constructor(firestore: AngularFirestore) { // doesn't work
}
```

I know what you're thinking, the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/classes.html#public) says

```
 Because public is already the default visibility modifier, you don’t ever need to write it on a class member.
```

That's not right, or not right in a way that doesn't require a lot of explaining. Here's a discussion of why we have to [use a visibility modifier here](https://github.com/angular/angularfire/issues/3173).

### 7. Set up Firestore collection

Open your Firebase Console and create your Firestore database, in test mode. Make a `collection` and call it `greatest-computer-scientists`. Firestore will ask you to make one document. Call the document `Charles Babbage` and put in two fields, both strings:

```
name: Charles Babbage
accomplishment: Built first computer
```

### 8. Bind an Observable to the Firestore collection

Import `Observable` from `rxjs`. Then make an instantiation of the `Observable` class.

In `/src/app/app.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'GreatestComputerScientists';

  scientists: Observable<any>;

  constructor(firestore: AngularFirestore) {
    this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
  }
}
```

In the constructor we query our database and store the results in `this.scientists`.

#### 8.1 Making an Interface or Type for a Firebase Collection

Did you notice that we set a type to `any`:

```ts
scientists: Observable<any>;
```

TypeScript hates it when we declare `any`. Surely we can declare an `interface` or `type`:

```ts
export declare interface Scientist {
  accomplishment: string,
  name: string,
}

export class AppComponent {
  scientists: Observable<Scientist>;
}
```

This throws an error:

```
Type 'Observable<unknown[]>' is not assignable to type 'Observable<Scientist>'.
Type 'unknown[]' is missing the following properties from type 'Scientist': accomplishment, name
```

This is saying that `Scientist` is a document (an object) but we're observing a collection, which is an array of documents.

Let's try this:

```ts
scientists: Observable<Scientist[]>;
```

The error message changes to

```ts
Type 'Observable<unknown[]>' is not assignable to type 'Observable<Scientist[]>'.
```

Apparently collections are not the same as arrays and I don't understand the difference. Firestore has a [Data Converter interface](https://firebase.google.com/docs/reference/js/firestore_.firestoredataconverter) that will make a type from your Firestore query. I haven't studied this. Until I can study this I'll just use `any` as the type for Firebase collections.

```ts
scientists: Observable<any>;
```

### 9. Make the HTML view

Now we'll make the view in `app.component.html`. Replace the placeholder view with:

```html
<h2>Greatest Computer Scientists</h2>

<h3>Create</h3>

<h3>Read</h3>

<h3>Update</h3>

<h3>Delete</h3>
```

You can remove `title` from `app.component.ts`.

### 10. READ

Let's start with the `Read` service. Add an `*ngFor` iterator to `app.component.html`:

```html
<h2>Greatest Computer Scientists</h2>

<h3>Create</h3>

<h3>Read</h3>
<ul>
  <li *ngFor="let scientist of scientists | async">
    {{scientist.name}}:
    {{scientist.accomplishment}}
  </li>
</ul>

<h3>Update</h3>

<h3>Delete</h3>
```

Now you should see `Charles Babbage: Built first computer` in your browser view. This is running Angular's `*ngFor` structural directive to make an unstructured list.

The `| async` pipe is used with an Observable or Promise that binds to an asynchronous source, such as a cloud database.

Firebase has [two types of READ operations](https://firebase.google.com/docs/firestore/query-data/get-data). You can get data once, or set a listener to observe changing data. We'll go into this after we finish the four CRUD operations.

### 11. CREATE in the view

Now we'll add the Create service. Add this to `app.component.html`:

```html
<h2>Greatest Computer Scientists</h2>

<h3>Create</h3>
<form (ngSubmit)="onCreate()">
  <input type="text" [(ngModel)]="name" name="name" placeholder="Name" required>
  <input type="text" [(ngModel)]="accomplishment" name="accomplishment" placeholder="Accomplishment">
  <button type="submit" value="Submit" >Submit</button>
</form>

<h3>Read</h3>
<ul>
  <li *ngFor="let scientist of scientists | async">
    {{scientist.name}}:
    {{scientist.accomplishment}}
  </li>
</ul>

<h3>Update</h3>

<h3>Delete</h3>
```

We're using an HTML form and the Angular `FormsModule`. The form is within the `<form></form>` directive.

```html
<form (ngSubmit)="onCreate()">
</form>
```

The parentheses around `ngSubmit` creates one-way data binding from the view `app.component.html` to the controller `app.component.ts`. When the `Submit` button is clicked the function `onCreate()` executes in `app.component.ts`. We'll make this function next.

Inside the form we have two text field and a `Submit` button. The first text field has two-way data binding (parenthesis and brackets) using `ngModel` to the variable `name` in the controller. The second text field binds to the variable `accomplishment`.

Clicking the button executes `ngSubmit` and the function `onCreate()`.

### 12. CREATE in the controller

In `app.component.ts` add the two variables and the function:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  scientists: Observable<any[]>;
  name: string | null = null;
  accomplishment: string | null = null;

  constructor(public firestore: AngularFirestore) {
    this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
  }

  onCreate() {
    console.log(this.name);
    console.log(this.accomplishment);
    if (this.name != null) {
      if (this.accomplishment != null) {
        this.firestore.collection('greatest-computer-scientists').doc(this.name).set({ name: this.name, accomplishment: this.accomplishment })
          .then(() => {
            this.name = null;
            this.accomplishment = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'name' is null.");
      }
    }
  }
}
```

The two variables `name` and `accomplishment` are strings or null and are initialized as `null`.

The function `onCreate()` first logs the variables so we can see if the data transferred from the view to the controller. The function then checks if `name` and `accomplishment` are null.

If the data is good then we call Firestore and make a document with the name of the computer scientist and two fields, the first for the scientist's name and the second for their accomplishment. Then we reset the variable to null to cleat the fields. Lastly we log success or throw an error.

Now you should be able to add more great computer scientists. Here are some suggestions:

```
Ada Lovelace: Wrote first software for Charles Babbage's computer
Alan Turing: First theorized computers with memory and instructions, i.e., general-purpose computers
John von Neumann: Built first general-purpose computer with memory and instructions
Donald Knuth: Father of algorithm analysis
Jeff Dean: Google's smartest computer scientist
```

#### 12.1 `add()` vs. `set()`

Firebase `add()` is similar to `set()`. The difference is that `set()` requires that you provide the document name. `add()` creates a document with an auto-generated ID number.

### 13. DELETE in the view

Now we'll implement the Delete service to `app.component.html`:

```html
<h2>Greatest Computer Scientists</h2>

<h3>Create</h3>
<form (ngSubmit)="onCreate()">
  <input type="text" [(ngModel)]="name" name="name" placeholder="Name" required>
  <input type="text" [(ngModel)]="accomplishment" name="accomplishment" placeholder="Accomplishment">
  <button type="submit" value="Submit" >Submit</button>
</form>

<h3>Read</h3>
<ul>
  <li *ngFor="let scientist of scientists | async">
    {{scientist.name}}:
    {{scientist.accomplishment}}
  </li>
</ul>

<h3>Update</h3>

<h3>Delete</h3>
<form (ngSubmit)="onDelete()">
  <select name="scientist" [(ngModel)]="selection">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

  <button type="submit" value="Submit" >Delete</button>
</form>
```

This form has a `<select><option>` dropdown menu for selecting a computer scientist to delete. In this we use Angular's `*ngFor` again. Unlike the READ service we must include `[ngValue]="scientist"` in the Delete service. Without this your selection isn't passed back to the controller.

### 14. DELETE in the controller

Now we'll make a variable `selection` and a method `onDelete()` into `app.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  scientists: Observable<any>;
  name: string | null = null;
  accomplishment: string | null = null;
  selection: { name: string } | null = null;

  constructor(public firestore: AngularFirestore) {
    this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
  }

  onCreate() {
    console.log(this.name);
    console.log(this.accomplishment);
    if (this.name != null) {
      if (this.accomplishment != null) {
        this.firestore.collection('greatest-computer-scientists').doc(this.name).set({ name: this.name, accomplishment: this.accomplishment })
          .then(() => {
            this.name = null;
            this.accomplishment = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'name' is null.");
      }
    }
  }

  onDelete() {
    if (this.selection != null) {
      this.firestore.collection('greatest-computer-scientists').doc(this.selection.name).delete()
        .then(() => {
          console.log("Document successfully deleted!");
          this.selection = null;
        }).catch((error) => {
          console.error("Error removing document: ", error);
        });
    }
  }
}
```

We check that the user selected a computer scientist, then we call Firestore and delete the document. For safety we reset `selection` to null.

### 15. UPDATE in the view

Now we'll do the Update service. This is more complicated and we'll get a lesson about Firestore data structure. Add the form to the `app.component.html` view:

```html
<h2>Greatest Computer Scientists</h2>

<h3>Create</h3>
<form (ngSubmit)="onCreate()">
  <input type="text" [(ngModel)]="name" name="name" placeholder="Name" required>
  <input type="text" [(ngModel)]="accomplishment" name="accomplishment" placeholder="Accomplishment">
  <button type="submit" value="Submit" >Submit</button>
</form>

<h3>Read</h3>
<ul>
  <li *ngFor="let scientist of scientists | async">
    {{scientist.name}}:
    {{scientist.accomplishment}}
  </li>
</ul>

<h3>Update</h3>
<form (ngSubmit)="onUpdate()">
  <select name="scientist" [(ngModel)]="selection">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

  <input type="text" [(ngModel)]="update" name="name" >
  <button type="submit" value="Submit" >Submit</button>
</form>

<h3>Delete</h3>
<form (ngSubmit)="onDelete()">
  <select name="scientist" [(ngModel)]="selection">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

  <button type="submit" value="Submit" >Delete</button>
</form>
```

Now we have two forms, a `<select><option>` to pick the computer scientist and a text field for the new `accomplishment`.

### 16. UPDATE in the controller

We'll add a variable `update` and a `onUpdate()` method to the `app.component.ts` controller:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  scientists: Observable<any>;
  name: string | null = null;
  accomplishment: string | null = null;
  selection: { name: string } | null = null;
  update: string | null = null;

  constructor(public firestore: AngularFirestore) {
    this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
  }

  onCreate() {
    console.log(this.name);
    console.log(this.accomplishment);
    if (this.name != null) {
      if (this.accomplishment != null) {
        this.firestore.collection('greatest-computer-scientists').doc(this.name).set({ name: this.name, accomplishment: this.accomplishment })
          .then(() => {
            this.name = null;
            this.accomplishment = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'name' is null.");
      }
    }
  }

  onUpdate() {
    if (this.selection != null) {
      console.log(this.selection.name);
      if (this.update != null) {
        console.log(this.update);
        this.firestore.collection('greatest-computer-scientists').doc(this.selection.name).update({ accomplishment: this.update })
          .then(() => {
            this.update = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'update' is null.");
      }
    } else {
      console.error("Input 'selection' is null.");
    }
  }

  onDelete() {
    if (this.selection != null) {
      this.firestore.collection('greatest-computer-scientists').doc(this.selection.name).delete()
        .then(() => {
          console.log("Document successfully deleted!");
          this.selection = null;
        }).catch((error) => {
          console.error("Error removing document: ", error);
        });
    }
  }
}
```

We make a new variable `update`. We could reuse `accomplishment` but then when we enter a computer scientist's accomplishment into CREATE it will also appear in UPDATE, and vice versa. Also if we make changes in `onCreate()` we might get a bug in `onUpdate()`.

Let's make Charles Babbage's accomplishment more clear. Update his accomplisment to

```
Attemped to build the first computer from brass, powered by steam
```

#### `set()` vs. `update()`

`set()` is for creating documents and their fields. `update()` is for updating the fields in an existing document.

If a document doesn't exist, `set()` will create the document. `update()` won't.

If you use `set()` to change one field it will wipe out all the other fields, unless you add `merge`. When you use `update()` on one field it won't change the other fields.

### 17. CRUD accomplished!

Yay! All four CRUD operations should work now.

Let's add another great computer scientist:

```
Robert Sanders: Invented generalized dynamic instruction handling
```

Robert Sanders was born in 1938. He worked at IBM and invented generalized dynamic instruction handling. Generalized dynamic instruction handling allows out-of-order execution, used by most modern computer processors to improve performance.

In 1968 Sanders heard about the then-new gender affirmation surgery and decided to become Lynn Conway. IBM fired her and she was legally denied access to her two children. (Robert Sanders had been married to a woman.) IBM apologized to Conway in 2020.

We're not transphobic so we'll update Robert Sanders to Lynn Conway while keeping her accomplishment.

Oh, wait, we can't, or not with the Update service. We'll have to delete Robert Sanders and create Lynn Conway.

Firestore is structured with `collections`, then `documents` in the collections, and then `fields` in the documents. I'm not sure if there's a "best practices" for this but it makes sense to me to update fields but not update documents. If we need to update a document, delete it and make a new document.

Another way would be to not specify document names but instead to allow Firestore to create documents with strings of letters and numbers. This is easy, just by removing `this.name` from the query:

```ts
this.firestore.collection('greatest-computer-scientists').doc().set({ name: this.name, accomplishment: this.accomplishment })
```

Then we could update `this.name` and there would be no record of Lynn Conway's birth name. This would make sense in some databases but not in others.

### 18. Get a Document

The Firebase method to get data once is `get()`. *AngularFire doesn't support getting data once.* If you need to get Firebase data once from Angular you'll have to do it without AngularFire. I don't know how to access Firebase from Angular without AngularFire.

#### 18.1 Get a Single Document in the View

Let's make a service to get single documents. In the view add another drop-down form:

```html
<h3>Get Document</h3>
<form>
    <select name="scientist" [(ngModel)]="showDocument">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>
</form>
<div *ngIf="showDocument">{{showDocument.accomplishment}}</div>
```

And in the controller add a variable `showDocument`:

```ts
showDocument: any | null = null;
```

That was easy!

#### 18.2 Get a Single Document and Log Data to the Console

We can show a single document in the view but that doesn't get us the data in the controller. Let's log the data in the `constructor`:

```ts
constructor(public firestore: AngularFirestore) {
    this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
    console.log(this.scientists);
  }
```

That logs an Observable when the page loads and nothing when we get a single document:

```
Observable {source: Observable, operator: ƒ}
operator: ƒ (liftedSource)
source: Observable {source: Observable, operator: ƒ}
[[Prototype]]: Object
```

You can dig down into the Observable as far as you want but you won't find any data.

#### 18.3 Make a Method to Log a Single Document

Let's make a method that fires when the user requests a single document. We'll add a `Submit` button and `(ngSubmit)`.

```html
<h3>Get Document</h3>
<form (ngSubmit)="getDocument()">
    <select name="scientist" [(ngModel)]="showDocument">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

    <button type="submit" value="Submit">Submit</button>
</form>
<div *ngIf="showDocument">{{showDocument.accomplishment}}</div>
```

In the controller we'll need a handler method:

```js
getDocument() {
  console.log(this.showDocument);
  console.log(this.showDocument.name);
  console.log(this.showDocument.accomplishment);
}
```

That was easy too!

We need to fix a UI issue. The property shows in the view before the user clicks the `Submit` button. Let's fix that.

```HTML
<div *ngIf="showDocumentAfterClick">{{showDocument.accomplishment}}</div>
```

```ts
showDocumentAfterClick: boolean = false;

getDocument() {
  console.log(this.showDocument);
  console.log(this.showDocument.name);
  console.log(this.showDocument.accomplishment);
  this.showDocumentAfterClick = true;
}
```

#### 18.4 Complete Code

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  scientists: Observable<any>;
  name: string | null = null;
  accomplishment: string | null = null;
  selection: { name: string } | null = null;
  update: string | null = null;
  showDocument: any | null = null;
  showDocumentAfterClick: boolean = false;

  constructor(public firestore: AngularFirestore) {
    this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
  }

  onCreate() {
    console.log(this.name);
    console.log(this.accomplishment);
    if (this.name != null) {
      if (this.accomplishment != null) {
        this.firestore.collection('greatest-computer-scientists').doc(this.name).set({ name: this.name, accomplishment: this.accomplishment })
          .then(() => {
            this.name = null;
            this.accomplishment = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'name' is null.");
      }
    }
  }

  getDocument() {
    console.log(this.showDocument);
    console.log(this.showDocument.name);
    console.log(this.showDocument.accomplishment);
    this.showDocumentAfterClick = true;
  }

  onUpdate() {
    if (this.selection != null) {
      console.log(this.selection.name);
      if (this.update != null) {
        console.log(this.update);
        this.firestore.collection('greatest-computer-scientists').doc(this.selection.name).update({ accomplishment: this.update })
          .then(() => {
            this.update = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'update' is null.");
      }
    } else {
      console.error("Input 'selection' is null.");
    }
  }

  onDelete() {
    if (this.selection != null) {
      this.firestore.collection('greatest-computer-scientists').doc(this.selection.name).delete()
        .then(() => {
          console.log("Document successfully deleted!");
          this.selection = null;
        }).catch((error) => {
          console.error("Error removing document: ", error);
        });
    }
  }
}
```

#### 18.5 GET vs. OBSERVE

Where does `this.showDocument` get its data? It's not getting data from Firebase. The data is coming via `ngModel` from the `<select><option>` form when the user selects a computer scientist. Let's instead query Firestore for a single document and log the results in the console.

We're using an Observable, not `get()`, so we need to subscribe to the Observable like a service. The model is:

```ts
this.showDocument.subscribe(scientist => {
       console.log(scientist?.name);
     })
```

We'll need a lot of new code to set this up. We'll keep the `getDocument()` method and make a new `observeDocument()` method. First, new HTML in `app.component.html`. This form is almost identical to the `Get Document` form.

```html
<h3>Observe Document</h3>
<form (ngSubmit)="observeDocument()">
    <select name="scientist" [(ngModel)]="showObservableDocument">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

    <button type="submit" value="Submit">Submit</button>
</form>
<div *ngIf="showObservableDocumentAfterClick">{{showObservableDocument.accomplishment}}</div>
```

In `app.component.ts` add:

```ts
export declare interface Scientist {
  accomplishment: string,
  name: string,
}

showObservableDocument: any | null = null;
showObservableDocumentAfterClick: boolean = false;
scientist: Observable<Scientist | undefined>;

constructor(public firestore: AngularFirestore) {
  this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
  this.scientist = firestore.collection('greatest-computer-scientists').doc<Scientist>('Ada Lovelace').valueChanges();
}

observeDocument() {
  this.scientist = this.firestore.collection('greatest-computer-scientists').doc<Scientist>(this.showObservableDocument?.name).valueChanges();
  this.scientist.subscribe(scientist => {
    console.table(scientist);
    console.log(scientist?.name);
    this.showObservableDocument = scientist;
    this.showObservableDocumentAfterClick = true;
  })
}
```

The top code block makes an interface (object) `Scientist` with two properties, `name` and `accomplishment`.

Next we make three new variables. The third variable is an Observable called `scientist`.

In the constructor we initialize the Observable `scientist`. The user won't see the initial value (Ada Lovelace) so this code seems pointless but TypeScript requires it.

Finally we make the new method `observeDocument()`. This queries Firestore, using the value that the user selected from the list. Then we `subscribe()` to the Observable. We display the results neatly in the console with `console.table` and also log one property. Finally we show the results in the view.

#### 18.6 Test GET vs. OBSERVE

In the view, select `Donald Knuth` in both `Get Document` and `Observe Document`. The displayed results should be the same: `Father of algorithm analysis`.

Go into your Firebase Console and change Donald Knuth's greatest accomplishment to `Father of Jenny Knuth`. Jenny and I were classmates at the Galvanize coding bootcamp. She's a genius, just like her father.

Now look at the view. You'll see that `Get Document` is showing the old value and `Observe Document` is showing the new value.

#### 18.6 Complete Code

app.component.html

```html
<h2>Who are the greatest computer scientists?</h2>

<h3>Create</h3>
<form (ngSubmit)="onCreate()">
    <input type="text" [(ngModel)]="name" name="name" placeholder="Name" required>
    <input type="text" [(ngModel)]="accomplishment" name="accomplishment" placeholder="Accomplishment">
    <button type="submit" value="Submit">Submit</button>
</form>

<h3>Read</h3>
<ul>
    <li *ngFor="let scientist of scientists | async">
        {{scientist.name}}: {{scientist.accomplishment}}
    </li>
</ul>

<h3>Update</h3>
<form (ngSubmit)="onUpdate()">
    <select name="scientist" [(ngModel)]="selection">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

    <input type="text" [(ngModel)]="update" name="name">
    <button type="submit" value="Submit">Submit</button>
</form>

<h3>Delete</h3>
<form (ngSubmit)="onDelete()">
    <select name="scientist" [(ngModel)]="selection">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

    <button type="submit" value="Submit">Delete</button>
</form>

<h3>Get Document</h3>
<form (ngSubmit)="getDocument()">
    <select name="scientist" [(ngModel)]="showDocument">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

    <button type="submit" value="Submit">Submit</button>
</form>
<div *ngIf="showDocumentAfterClick">{{showDocument.accomplishment}}</div>

<h3>Observe Document</h3>
<form (ngSubmit)="observeDocument()">
    <select name="scientist" [(ngModel)]="showObservableDocument">
    <option *ngFor="let scientist of scientists | async" [ngValue]="scientist">
      {{ scientist.name }}
    </option>
  </select>

    <button type="submit" value="Submit">Submit</button>
</form>
<div *ngIf="showObservableDocumentAfterClick">{{showObservableDocument.accomplishment}}</div>
```

app.component.ts
```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

export declare interface Scientist {
  accomplishment: string,
  name: string,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  scientists: Observable<any>;
  name: string | null = null;
  accomplishment: string | null = null;
  selection: { name: string } | null = null;
  update: string | null = null;
  showDocument: any | null = null;
  getDoc: string | null = null;
  showDocumentAfterClick: boolean = false;
  showObservableDocument: any | null = null;
  showObservableDocumentAfterClick: boolean = false;
  scientist: Observable<Scientist | undefined>;
  // private scientistDoc: AngularFirestoreDocument<Scientist>;

  constructor(public firestore: AngularFirestore) {
    this.scientists = firestore.collection('greatest-computer-scientists').valueChanges();
    this.scientist = firestore.collection('greatest-computer-scientists').doc<Scientist>('Ada Lovelace').valueChanges();
  }

  onCreate() {
    console.log(this.name);
    console.log(this.accomplishment);
    if (this.name != null) {
      if (this.accomplishment != null) {
        this.firestore.collection('greatest-computer-scientists').doc(this.name).set({ name: this.name, accomplishment: this.accomplishment })
          .then(() => {
            this.name = null;
            this.accomplishment = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'name' is null.");
      }
    }
  }

  getDocument() {
    console.log(this.showDocument);
    console.log(this.showDocument.name);
    console.log(this.showDocument.accomplishment);
    this.showDocumentAfterClick = true;
  }

  observeDocument() {
    this.scientist = this.firestore.collection('greatest-computer-scientists').doc<Scientist>(this.showObservableDocument?.name).valueChanges();
    this.scientist.subscribe(scientist => {
      console.table(scientist);
      console.log(scientist?.name);
      this.showObservableDocument = scientist;
      this.showObservableDocumentAfterClick = true;
    })
  }

  onUpdate() {
    if (this.selection != null) {
      console.log(this.selection.name);
      if (this.update != null) {
        console.log(this.update);
        this.firestore.collection('greatest-computer-scientists').doc(this.selection.name).update({ accomplishment: this.update })
          .then(() => {
            this.update = null;
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      } else {
        console.error("Input 'update' is null.");
      }
    } else {
      console.error("Input 'selection' is null.");
    }
  }

  onDelete() {
    if (this.selection != null) {
      this.firestore.collection('greatest-computer-scientists').doc(this.selection.name).delete()
        .then(() => {
          console.log("Document successfully deleted!");
          this.selection = null;
        }).catch((error) => {
          console.error("Error removing document: ", error);
        });
    }
  }
}
```

### 19. Firebase Extends Beyond CRUD

CRUD was modeled back when you had to query databases to get data. Firebase pioneered a new type of database, in which data changes in realtime.

For example, let's order a pizza. The GPS device in the driver's phone detects when their car is moving and updates the cloud database with new location data. The database sends the data updates to an app on your phone. Your view updates showing the driver getting closer to your house.

Does the driver click a button to send the GPS data to the cloud database? No. Do you click `Refresh` to see if the cloud database has new data and, if so, download it and update your view? No. Modern apps use Firebase to stream data up and down without queries. This is not any of the four CRUD operations.

I'm going to call these two operations Streaming and Observing. Maybe there are better names, such as data binding.

Looking at our `app.component.ts` controller, we have methods for CREATE, UPDATE, and DELETE. The `getDocument()` method doesn't call Firebase. Our READ operation is using an Observer, not `get()` so IMHO it's not OBSERVE, not READ.

How about the other direction? Can Firebase observe data in Angular? No, when data changes in Angular you have to send an `update()` query to Firebase.

Firebase has CREATE, READ, UPDATE, DELETE, and OBSERVE, or CRUDO. AngularFire has CREATE, UPDATE, DELETE, and OBSERVE, or C*UDO.
