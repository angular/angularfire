# 2. Retrieving data as objects

> AngularFire2 synchronizes data as objects using the `FirebaseObjectObservable`. 
The `FirebaseObjectObservable` is not created by itself, but through the `AngularFire.database` service. 
The guide below demonstrates how to retrieve, save, and remove data as objects.

## Injecting the AngularFire service

**Make sure you have bootstrapped your application for AngularFire2. See the Installation guide for bootstrap setup.**

AngularFire is an injectable service, which is injected through the constructor of your Angular component or `@Injectable()` service.

```ts
import { Component } from '@angular/core';
import { AngularFire } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: 'app',
  template: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(af: AngularFire) {
    
  }
}
```

## Create an object binding

Data is retrieved through the `af.database` service.

There are three ways to create an object binding:

1. Relative URL
2. Absolute URL
3. Reference

```ts
// relative URL, uses the database url provided in bootstrap
const relative = af.database.object('/item');
// absolute URL
const absolute = af.database.object('https://<your-app>.firebaseio.com/item');
// database reference
const dbRef = new Firebase('https://<your-app>.firebaseio.com/item');
const relative = af.database.object(dbRef);
```

### Retrieve data

To get the object in realtime, create an object binding as a property of your component or service.
Then in your template, you can use the `async` pipe to unwrap the binding.

```ts
import {Component} from 'angular2/core';
import {AngularFire, FirebaseObjectObservable} from 'angularfire2';

@Component({
  selector: 'app',
  template: `
  <h1>{{ (item | async)?.name }}</h1>
  `,
})
export class AppComponent {
  item: FirebaseObjectObservable<any>;
  constructor(af: AngularFire) {
    this.item = af.database.object('/item');
  }
}
```

## Saving data

### API Summary

The table below highlights some of the common methods on the `FirebaseObjectObservable`.

| method   |                    | 
| ---------|--------------------| 
| set(value: any)      | Replaces the current value in the database with the new value specified as the parameter. This is called a **destructive** update, because it deletes everything currently in place and saves the new value. | 
| update(value: Object)   | Updates the current value with in the database with the new value specified as the parameter. This is called a **non-destructive** update, because it only updates the values specified. |
| remove()   | Deletes all data present at that location. Same as calling `set(null)`. |

## Returning promises
Each data operation method in the table above returns a promise. However,
you should rarely need to use the completion promise to indicate success, 
because the realtime database keeps the object in sync. 

The promise can be useful to chain multiple operations, catching possible errors
from security rules denials, or for debugging.

```ts
const promise = af.database.object('/item').remove();
promise
  .then(_ => console.log('success'))
  .catch(err => console.log(err, 'You dont have access!'));
```

### Saving data

Use the `set()` method for **destructive updates**.

```ts
const itemObservable = af.database.object('/item');
itemObservable.set({ name: 'new name!'});
```

### Updating data

Use the `update()` method for **non-destructive updates**.

```ts
const itemObservable = af.database.object('/item');
itemObservable.update({ age: newAge });
```

**Only objects are allowed for updates, not primitives**. This is because
using an update with a primitive is the exact same as doing a `.set()` with a primitive.

### Deleting data
Use the `remove()` method to remove data at the object's location.

```ts
const itemObservable = af.database.object('/item');
itemObservable.remove();
```

**Example app**: 

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: 'app',
  template: `
  <h1>{{ item | async | json }}</h1>
  <input type="text" #newname placeholder="Name" />
  <input type="text" #newsize placeholder="Size" />
  <br />
  <button (click)="save(newname.value)">Set Name</button>
  <button (click)="update(newsize.value)">Update Size</button>
  <button (click)="delete()">Delete</button>
  `,
})
export class RcTestAppComponent {
  item: FirebaseObjectObservable<any>;
  constructor(af: AngularFire) {
    this.item = af.database.object('/item');
  }
  save(newName: string) {
    this.item.set({ name: newName });
  }
  update(newSize: string) {
    this.item.update({ size: newSize });
  }
  delete() {
    this.item.remove();
  }
}
```

## Meta-fields on the object
Data retrieved from the object binding contains special properties retrieved from the unwrapped Firebase DataSnapshot.

| property |                    | 
| ---------|--------------------| 
| $key     | The key for each record. This is equivalent to each record's path in our database as it would be returned by `ref.key()`.|
| $value   | If the data for this child node is a primitive (number, string, or boolean), then the record itself will still be an object. The primitive value will be stored under `$value` and can be changed and saved like any other field.|


## Retrieving the snapshot
AngularFire2 unwraps the Firebase DataSnapshot by default, but you can get the data as the original snapshot by specifying the `preserveSnapshot` option. 

```ts
this.item = af.database.object('/item', { preserveSnapshot: true });
this.item.subscribe(snapshot => {
  console.log(snapshot.key)
  console.log(snapshot.val())
});
```

## Querying?
The `FirebaseObjectObservable` synchronizes objects from the realtime database. There is no querying available for objects because 
objects are simply JSON, and JSON order is specified by the browser.

###[Next Step: Retrieving data as lists](3-retrieving-data-as-lists.md)
