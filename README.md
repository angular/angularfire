<p align="center">
  <h1 align="center">AngularFire2</h1>
  <p align="center">The official library for Firebase and Angular 2</p>
</p>

[![Build Status](https://travis-ci.org/angular/angularfire2.svg?branch=master)](https://travis-ci.org/angular/angularfire2) [![Join the chat at https://gitter.im/angular/angularfire2](https://badges.gitter.im/angular/angularfire2.svg)](https://gitter.im/angular/angularfire2?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Status: Release candidate

## What is AngularFire2?

- **Observable based** - Use the power of rxjs, Angular 2, and Firebase.
- **Realtime bindings** - Synchronize database collections as objects or lists.
- **Authentication** - Monitor authentication state in realtime.

#### Quick links
[Contributing](CONTRIBUTING.md)

[Plunker Template](http://plnkr.co/edit/8yY4tH?p=preview) - Requires to set your Firebase credentials in `app.module.ts`.

[Upgrading to v4.0? Check out our guide.](docs/version-4-upgrade.md)

## Install

```bash
npm install firebase angularfire2 --save
```

## Example use:

```ts
import {Component} from '@angular/core';
import {AngularFireDatabase, FirebaseListObservable} from 'angularfire2/database';

@Component({
  selector: 'project-name-app',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
      {{ item.name }}
    </li>
  </ul>
  `
})
export class MyApp {
  items: FirebaseListObservable<any[]>;
  constructor(db: AngularFireDatabase) {
    this.items = db.list('/items');
  }
}
```

## Developer Guide
If you want to get started quickly on building with AngularFire2, check out our
5 step developer guide that will teach you everything you need to know to be 
productive with AngularFire2.

1. [Installation & Setup](docs/1-install-and-setup.md)
2. [Retreiving data as objects - FirebaseObjectObservable](docs/2-retrieving-data-as-objects.md)
3. [Retreiving data as lists - FirebaseListObservable](docs/3-retrieving-data-as-lists.md)
4. [Querying lists](docs/4-querying-lists.md)
5. [User Authentication - FirebaseAuthentication](docs/5-user-authentication.md)
6. [Using AngularFire2 with Ionic 2](docs/Auth-with-Ionic2.md)
7. [Using AngularFire2 with Ionic 3 and Angular 4](docs/Auth-with-Ionic3-Angular4.md)
