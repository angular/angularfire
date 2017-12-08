# 3. Retrieving data as lists

> AngularFire synchronizes data as lists using the `AngularFireList` service.

The `AngularFireList` service is not created by itself, but through the `AngularFireDatabase` service. 

The guide below demonstrates how to retrieve, save, and remove data as lists.

## Injecting the AngularFireDatabase service

**Make sure you have bootstrapped your application for AngularFire. See the Installation guide for bootstrap setup.**

AngularFireDatabase is a service which can be injected through the constructor of your Angular component or `@Injectable()` service.
In the previous step, we modified the `/src/app/app.component.ts` to retrieve data as an object. In this step, let's start with a clean slate.

Replace your  `/src/app/app.component.ts` from previous step to look like below.

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(db: AngularFireDatabase) {
    
  }
}
```

In this section, we're going to modify the `/src/app/app.component.ts`  to retrieve data as list, but before that let's look at ways around how to bind to a list.

## Create a list binding

Data is retrieved through the `AngularFireDatabase` service. The service is also generic. Provide the singular type and not the array type.

```ts
const listRef = db.list('items');
const shirtsRef = db.list<Shirt>('shirts');
```

### Retrieve data

To get the list in realtime, create a list binding as a property of your component or service.

Then in your template, you can use the `async` pipe to unwrap the binding.

Update `/src/app/app.component.ts` to import `AngularFireList` from angularfire2 and iterate thru the list once data is retrieved. Also note the change in attribute `templateUrl` to inline `template` below.

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
       {{ item | json }}
    </li>
  </ul>
  `,
})
export class AppComponent {
  items: Observable<any[]>;
  constructor(db: AngularFireDatabase) {
    this.items = db.list('items').valueChanges();
  }
}
```

## `AngularFireAction` - Action based API
AngularFire provides methods that stream data back as redux compatible actions. This gives you extra horsepower when using libraries like Animations, ngrx, and ReactiveForms. 

### `valueChanges()`
**What is it?** - Returns an Observable of data as a synchronized array of JSON objects. All Snapshot metadata is stripped and just the method provides only the data.

**Why would you use it?** - When you just need a list of data. No snapshot metadata is attached to the resulting array which makes it simple to render to a view.

**When would you not use it?** - When you need a more complex data structure than an array or you need the `key` of each snapshot for data manipulation methods. This method assumes you either are saving the `key` for the snapshot data or using a "readonly" approach.

### `snapshotChanges()`
**What is it?** - Returns an Observable of data as a synchronized array of `AngularFireAction<DatabaseSnapshot>[]`. 

**Why would you use it?** - When you need a list of data but also want to keep around metadata. Metadata provides you the underyling `DatabaseReference` and snapshot key. Having the snapshot's `key` around makes it easier to use data manipulation methods. This method gives you more horsepower with other Angular integrations such as ngrx, forms, and animations due to the `type` property. The `type` property on each `AngularFireAction` is useful for ngrx reducers, form states, and animation states.

**When would you not use it?** - When you need a more complex data structure than an array or if you need to process changes as they occur. This array is synchronized with the remote and local changes in the Firebase Database.

### `stateChanges()`
**What is it?** - Returns an Observable of the most recent change as a `AngularFireAction`. 

**Why would you use it?** - The above methods return a singular `AngularFireAction` from each child event that occurs. `stateChanges()` emits changes as they occur rather than syncing the query order. This works well for ngrx integrations as you can build your own data structure in your reducer methods.

**When would you not use it?** - When you just need a list of data. This is a more advanced usage of `AngularFireDatabase`. 

### `auditTrail()`
**What is it?** - Returns an Observable of `AngularFireAction[]` as they occur. Similar to `stateChanges()`, but instead it keeps around the trail of events as an array.

**Why would you use it?** - This method is like `stateChanges()` except it is not ephemeral. It collects each change in an array as they occur. This is useful for ngrx integrations where you need to replay the entire state of an application. This also works as a great debugging tool for all applications. You can simple write `db.list('items').auditTrail().subscribe(console.log)` and check the events in the console as they occur.

**When would you not use it?** - When you just need a list of data. This is a more advanced usage of AngularFireDatabase. 

### Limiting events

There are four child events: `"child_added"`, `"child_changed"`, `"child_removed"`, and `"child_moved"`. Each streaming method listens to all four by default. However, your site may only be intrested in one of these events. You can specify which events you'd like to use through the first parameter of each method:

```ts
this.itemsRef = db.list('items');
this.itemsRef.snapshotChanges(['child_added'])
  .subscribe(actions => {
    actions.forEach(action => {
      console.log(action.type);
      console.log(action.key);
      console.log(action.payload.val());
    });
  });
```

## Saving data

### API Summary

The table below highlights some of the common methods on the `AngularFireList`.

| method   |                    | 
| ---------|--------------------| 
| `push(value: T)` | Creates a new record on the list, using the Realtime Database's push-ids. | 
| `update(keyRefOrSnap: string, value: T)` | Firebase | AFUnwrappedSnapshot, value: Object) | Updates an existing item in the array. Accepts a key, database reference, or an unwrapped snapshot. |
| `remove(key: string?)` | Deletes the item by key. If no parameter is provided, the entire list will be deleted. |

## Returning promises
Each data operation method in the table above returns a promise. However,
you should rarely need to use the completion promise to indicate success, 
because the realtime database keeps the list in sync. 

The promise can be useful to chain multiple operations, catching possible errors
from security rules denials, or for debugging.

```ts
const promise = db.list('items').remove();
promise
  .then(_ => console.log('success'))
  .catch(err => console.log(err, 'You do not have access!'));
```

### Adding new items

Use the `push()` method to add new items on the list.

```ts
const itemsRef = db.list('items');
itemsRef.push({ name: newName });
```

### Replacing items in the list using `set`

Use the `set()` method to update existing items.

```ts
const itemsRef = db.list('items');
// to get a key, check the Example app below
itemsRef.set('key-of-some-data', { size: newSize });
```

Replaces the current value in the database with the new value specified as the parameter. This is called a destructive update, because it deletes everything currently in place and saves the new value.

### Updating items in the list using `update`

Use the `update()` method to update existing items.

```ts
const itemsRef = db.list('items');
// to get a key, check the Example app below
itemsRef.update('key-of-some-data', { size: newSize });
```

Note that this updates the current value with in the database with the new value specified as the parameter. This is called a non-destructive update, because it only updates the values specified.

### Removing items from the list
Use the `remove()` method to remove data at the list item's location.

```ts
const itemsRef = db.list('items');
// to get a key, check the Example app below
itemsRef.remove('key-of-some-data');
```

## Deleting the entire list

If you omit the `key` parameter from `.remove()` it deletes the entire list.

```ts
const itemsRef = db.list('items');
itemsRef.remove();
```

**Example app**

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
      <input type="text" #updatetext [value]="item.text" />
      <button (click)="updateItem(item.key, updatetext.value)">Update</button>
      <button (click)="deleteItem(item.key)">Delete</button>
    </li>
  </ul>
  <input type="text" #newitem />
  <button (click)="addItem(newitem.value)">Add</button>
  <button (click)="deleteEverything()">Delete All</button>
  `,
})
export class AppComponent {
  itemsRef: AngularFireList<any>;
  items: Observable<any[]>;
  constructor(db: AngularFireDatabase) {
    this.itemsRef = db.list('messages');
    // Use snapshotChanges().map() to store the key
    this.items = this.itemsRef.snapshotChanges().map(changes => {
      return changes.map(c => ({ key: c.payload.key, ...c.payload.val() }));
    });
  }
  addItem(newName: string) {
    this.itemsRef.push({ text: newName });
  }
  updateItem(key: string, newText: string) {
    this.itemsRef.update(key, { text: newText });
  }
  deleteItem(key: string) {    
    this.itemsRef.remove(key); 
  }
  deleteEverything() {
    this.itemsRef.remove();
  }
}
```

### [Next Step: Querying lists](querying-lists.md)
