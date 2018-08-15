# Upgrading to AngularFire 5.0

AngularFire 5.0 is a refactor of the `AngularFireDatabase` module. It removes the `FirebaseListObservable` and `FirebaseObjectObservable` in favor of a generic based service API.

## Updating `FirebaseListObservable` to `AngularFireList<T>`

Rather than `.list()` returning a `FirebaseListObservable`, it now returns an `AngularFireList<T>`. This service contains methods that allow you manipulate and stream data.

In the case of streaming back data, you now call one of the observable methods on `AngularFireList`.

### 4.0

```ts
constructor(afDb: AngularFireDatabase) {
  afDb.list('items').subscribe(console.log);
}
```

### 5.0

```ts
constructor(afDb: AngularFireDatabase) {
  afDb.list<Item>('items').valueChanges().subscribe(console.log);
}
```

The same concepts apply to `FirebaseObjectObservable` to `AngularFireObject`.

## Moving away from `$key` and `$value`

In AngularFireDatabase 4.0 the snapshot was automatically unwrapped for you and metadata was placed in `$` property. The Firebase Database rejects any keys with `$` in them so this mechanism allowed us to provide you with important metadata alongside your actual data. However, persisting the object could be a pain in some cases as the SDK would reject any `$` based properties. In 5.0 we have moved away from `$` properties and we provide multiple observable methods for receiving the data.

Calling `.valueChanges()` returns an Observable without any metadata. If you are already persisting the key as a property then you are fine. However, if you are relying on `$key`, then you need to use `.snapshotChanges()` and transform the data with an observable `.map()`.

### 4.0

```ts
constructor(afDb: AngularFireDatabase) {
  afDb.list('items').subscribe(items => { 
    const allKeys = items.map(item => item.$key);
  });
}
```

### 5.0

```ts
constructor(afDb: AngularFireDatabase) {
  afDb.list('items').snapshotChanges().pipe(
    map(actions => 
      actions.map(a => ({ key: a.key, ...a.payload.val() }))
    )
  ).subscribe(items => {
    return items.map(item => item.key);
  });
}
```

## Data manipulation methods

AngularFire 5.0 removes all custom observables which means their custom operators are gone as well. Instead of using custom operators on either a `FirebaseListObservable` or a `FirebaseObjectObservable`, use the methods on the service based APIs: `AngularFireList` and `AngularFireObject`. There is no resulting code change, but it worth pointing out.

### 4.0

```ts
constructor(afDb: AngularFireDatabase) {
  const listObservable = afDb.list('items');
  listObservable.push({ name: 'item' });
  listObservable.subscribe();
}
```

### 5.0

```ts
constructor(afDb: AngularFireDatabase) {
  const afList = afDb.list('items');
  afList.push({ name: 'item' });
  const listObservable = afList.snapshotChanges();
  listObservable.subscribe();
}
```
