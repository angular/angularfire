# 2. Retrieving data as objects

> AngularFire2 synchronizes data as objects using the `FirebaseObjectObservable`. 
The `FirebaseObjectObservable` is not created by itself, but through the `AngularFire.database` service. 
The guide below demonstrates how to retreive, save, and remove data as objects.

## Injecting the AngularFire service

**Make sure you have bootstrapped your application for AngularFire2. See the Installation guide for bootstrap setup.**

AngularFire is an injectable service, which is injected through the constructor of your Angular component or `@Injectable()` service.

```ts
import {Component} from 'angular2/core';
import {AngularFire} from 'angularfire2';

@Component({
  selector: 'app',
  templateUrl: 'app/app.html',
})
class AppComponent {
  constructor(af: AngularFire) {
         
  }
}
```

## Create an object binding

Data is retreived through the `af.database` service.

There are three ways to create an object binding:

1. Relative URL
2. Absolute URL
3. Reference or Query

```ts
// relative URL, uses the database url provided in bootstrap
const relative = af.database.object('/item');
// absolute URL
const absolute = af.database.object('https://<your-app>.firebaseio.com/item');
// database reference
const dbRef = new Firebase('https://<your-app>.firebaseio.com/item');
const relative = af.database.object(dbRef);
```

### Retreive data

To get the object in realtime, create an object binding as a property of your component or service.
Then in your template, you can use the `async` pipe to unwrap the binding.

```ts
import {Component} from 'angular2/core';
import {AngularFire, FirebaseObjectObservable} from 'angularfire2';

@Component({
  selector: 'app',
  templateUrl: `
  <h1>{{ item.name | async }}</h1>
  `,
})
class AppComponent {
  item: Observable<any>;
  constructor(af: AngularFire) {
    this.item = af.database.object('/item');
  }
}
```

## Saving data

### API Summary

The table below highlights some of the common methods on the `FirebaseObjectObservale`.

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
import {Component} from 'angular2/core';
import {AngularFire, FirebaseObjectObservable} from 'angularfire2';

@Component({
  selector: 'app',
  templateUrl: `
  <h1>{{ item.name | async }}</h1>
  <input type="text" #newname />
  <button (click)="save(newname.value)">Save</button>
  `,
})
class AppComponent {
  item: Observable<any>;
  constructor(af: AngularFire) {
    this.item = af.database.object('/item');
  }
  save(newName: string) {
    this.item.set(newName);
  }
}
```

### Updating data

Use the `update()` method for **non-destructive updates**.

```ts
import {Component} from 'angular2/core';
import {AngularFire, FirebaseObjectObservable} from 'angularfire2';

@Component({
  selector: 'app',
  templateUrl: `
  <h1>{{ item.name | async }}</h1>
  <h2>{{ item.age | async }}</h1>
  <input type="text" #newage />
  <button (click)="update(newage.value)">Update</button>
  `,
})
class AppComponent {
  item: Observable<any>;
  constructor(af: AngularFire) {
    this.item = af.database.object('/item');
  }
  update(newAge: string) {
    this.item.update({ age: newAge });
  }
}
```

### Deleting data
Use the `remove()` method to remove data at the object's location.

```ts
import {Component} from 'angular2/core';
import {AngularFire, FirebaseObjectObservable} from 'angularfire2';

@Component({
  selector: 'app',
  templateUrl: `
  <h1>{{ item.name | async }}</h1>
  <button (click)="delete()">Delete</button>
  `,
})
class AppComponent {
  item: Observable<any>;
  constructor(af: AngularFire) {
    this.item = af.database.object('/item');
  }
  delete() {
    this.item.remove();
  }
}
```

## Meta-fields on the object
Data retreived from the object binding contains special properties retreived from the unwrapped Firebase DataSnapshot.

| property |                    | 
| ---------|--------------------| 
| $key     | The key for each record. This is equivalent to each record's path in our database as it would be returned by `ref.key()`.|
| $value   | If the data for this child node is a primitive (number, string, or boolean), then the record itself will still be an object. The primitive value will be stored under `$value` and can be changed and saved like any other field.|

```ts
// TODO: Code example
```

## Retreiving the snapshot
AngularFire2 unwraps the Firebase DataSnapshot by default, but you can get the data as the original snapshot by specifying the `preserveSnapshot` option. 

```ts
this.item = af.database.object('/item', { preserveSnapshot: true });
this.item.subscribe(snapshot => console.log(snapshot.key()));
```

## Querying?
The `FirebaseObjectObservable` synchronizes objects from the realtime database. There is no querying available for objects because 
objects are simply JSON, and JSON order is specified by the browser.