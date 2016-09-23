# 3. Retrieving data as lists

> AngularFire2 synchronizes data as lists using the `FirebaseListObservable`. 
The `FirebaseListObservable` is not created by itself, but through the `AngularFire.database` service. 
The guide below demonstrates how to retrieve, save, and remove data as lists.

## Injecting the AngularFire service

**Make sure you have bootstrapped your application for AngularFire2. See the Installation guide for bootstrap setup.**

AngularFire is an injectable service, which is injected through the constructor of your Angular component or `@Injectable()` service.
In the previous step, we modified the `/src/app/app.component.ts` to retrieve data as object. In this step, let's start with a clean slate.

Replace your  `/src/app/app.component.ts` from previous step to look like below.

```ts
import { Component } from '@angular/core';
import { AngularFire } from 'angularfire2';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(af: AngularFire) {
    
  }
}
```

In this section, we're going to modify the `/src/app/app.component.ts`  to retreive data as list, but before that let's look at ways around how to bind to a list.

## Create a list binding

Data is retrieved through the `af.database` service.

There are three ways to create an object binding:

1. Relative URL
1. Absolute URL
1. Query

```ts
// relative URL, uses the database url provided in bootstrap
const relative = af.database.list('/items');
// absolute URL
const absolute = af.database.list('https://<your-app>.firebaseio.com/items');
// query 
const queryList = af.database.list('/items', {
  query: {
    limitToLast: 10,
    orderByKey: true
  }
});
```

### Retrieve data

To get the list in realtime, create a list binding as a property of your component or service.
Then in your template, you can use the `async` pipe to unwrap the binding.

Update `/src/app/app.component.ts` to import `FirebaseListObservable` from angularfire2 and iterate thru the list once data is retrieved. Also note the change in attribute `templateUrl` to inline `template` below.

```ts
import {Component} from '@angular/core';
import {AngularFire, FirebaseListObservable} from 'angularfire2';

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
       {{ item.$value }}
    </li>
  </ul>
  `,
})
export class AppComponent {
  items: FirebaseListObservable<any>;
  constructor(af: AngularFire) {
    this.items = af.database.list('/items');
  }
}
```

## Saving data

### API Summary

The table below highlights some of the common methods on the `FirebaseListObservable`.

| method   |                    | 
| ---------|--------------------| 
| push(value: any) | Creates a new record on the list, using the Realtime Database's push-ids. | 
| update(keyRefOrSnap: string) | Firebase | AFUnwrappedSnapshot, value: Object) | Updates an existing item in the array. Accepts a key, database reference, or an unwrapped snapshot. |
| remove(key: string?) | Deletes the item by key. If no parameter is provided, the entire list will be deleted. |

## Returning promises
Each data operation method in the table above returns a promise. However,
you should rarely need to use the completion promise to indicate success, 
because the realtime database keeps the list in sync. 

The promise can be useful to chain multiple operations, catching possible errors
from security rules denials, or for debugging.

```ts
const promise = af.database.list('/items').remove();
promise
  .then(_ => console.log('success'))
  .catch(err => console.log(err, 'You do not have access!'));
```

### Adding new items

Use the `push()` method to add new items on the list.

```ts
const items = af.database.list('/items');
items.push({ name: newName });
```

### Updating items in the list

Use the `update()` method to update existing items.

```ts
const items = af.database.list('/items');
// to get a key, check the Example app below
items.update('key-of-some-data', { size: newSize });
```

### Removing items from the list
Use the `remove()` method to remove data at the list item's location.

```ts
const items = af.database.list('/items');
// to get a key, check the Example app below
items.remove('key-of-some-data');
```

## Deleting the entire list

If you omit the `key` parameter from `.remove()` it deletes the entire list.

```ts
const items = af.database.list('/items');
items.remove();
```

**Example app**

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
      <input type="text" #updatetext [value]="item.text" />
      <button (click)="updateItem(item.$key, updatetext.value)">Update</button>
      <button (click)="deleteItem(item.$key)">Delete</button>
    </li>
  </ul>
  <input type="text" #newitem />
  <button (click)="addItem(newitem.value)">Add</button>
  <button (click)="deleteEverything()">Delete All</button>
  `,
})
export class AppComponent {
  items: FirebaseListObservable<any>;
  constructor(af: AngularFire) {
    this.items = af.database.list('/messages');
  }
  addItem(newName: string) {
    this.items.push({ text: newName });
  }
  updateItem(key: string, newText: string) {
    this.items.update(key, { text: newText });
  }
  deleteItem(key: string) {    
    this.items.remove(key); 
  }
  deleteEverything() {
    this.items.remove();
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
this.items = af.database.list('/items', { preserveSnapshot: true });
this.items
  .subscribe(snapshots => {
    snapshots.forEach(snapshot => {
      console.log(snapshot.key)
      console.log(snapshot.val())
    });
  })
```

###[Next Step: Querying lists](4-querying-lists.md)
