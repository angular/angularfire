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

[Stackblitz Template](https://stackblitz.com/edit/angular-2ed5zx?) - Remember to set your Firebase configuration in `app/app.module.ts`.

[Upgrading to v4.0? Check out our guide.](docs/version-4-upgrade.md)

## Install

```bash
npm install firebase angularfire2 --save
```

## Example use:

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

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

## Getting started
[Installation & Setup](docs/1-install-and-setup.md)

## AngularFirestore
[Using collections](docs/firestore/collections.md)
[Using documents](docs/firestore/documents.md)

## AngularFireAuth
[User Authentication](docs/5-user-authentication.md)

## AngularFireDatabase
[Retrieving data as objects](docs/2-retrieving-data-as-objects.md)
[Retrieving data as lists](docs/3-retrieving-data-as-lists.md)
[Querying lists](docs/4-querying-lists.md)

## Ionic
[Using AngularFire2 with Ionic 2](docs/Auth-with-Ionic2.md)
[Using AngularFire2 with Ionic 3 and Angular 4](docs/Auth-with-Ionic3-Angular4.md)

## Deploying to Firebase Hosting
[Deploying AngularFire to Firebase Hosting](docs/7-deploying-angularfire-to-firebase.md)
