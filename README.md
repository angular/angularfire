<p align="center">
  <h1 align="center">AngularFire</h1>
  <p align="center">The official library for Firebase and Angular</p>
</p>

[![Build Status](https://travis-ci.org/angular/angularfire2.svg?branch=master)](https://travis-ci.org/angular/angularfire2) [![Join the chat at https://gitter.im/angular/angularfire2](https://badges.gitter.im/angular/angularfire2.svg)](https://gitter.im/angular/angularfire2?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Status: Release candidate

## What is AngularFire?

- **Observable based** - Use the power of RxJS, Angular, and Firebase.
- **Realtime bindings** - Synchronize data in reatime.
- **Authentication** - Log users in with a variety of providers and monitor authentication state in realtime.
- **ngrx friendly** - Integrate with ngrx using AngularFire's action based APIs.

#### Quick links
[Contributing](CONTRIBUTING.md)

[Stackblitz Template](https://stackblitz.com/edit/angular-2ed5zx?) - Remember to set your Firebase configuration in `app/app.module.ts`.

[Upgrading to v5.0? Check out our guide.](docs/version-5-upgrade.md)

## Install

```bash
npm install firebase angularfire2 --save
# Or use the 5.0 beta API! Will be released soon
npm install firebase angularfire2@next --save
```

## Note: These docs reference the beta 5.0 API which will be released soon.

## Example use:

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

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
  items: Observable<any[]>;
  constructor(db: AngularFireDatabase) {
    this.items = db.list('items').valueChanges();
  }
}
```

## Developer Guide

### Getting started
- [Installation & Setup](docs/1-install-and-setup.md)

### AngularFireDatabase
- [Retrieving data as objects](docs/2-retrieving-data-as-objects.md)
- [Retrieving data as lists](docs/3-retrieving-data-as-lists.md)
- [Querying lists](docs/4-querying-lists.md)

### AngularFireAuth
- [User Authentication](docs/5-user-authentication.md)

### Deploy to Firebase Hosting
- [Deploying AngularFire to Firebase Hosting](docs/7-deploying-angularfire-to-firebase.md)

### Ionic
- [Using AngularFire with Ionic 2](docs/Auth-with-Ionic2.md)
- [Using AngularFire with Ionic 3 and Angular 4](docs/Auth-with-Ionic3-Angular4.md)
