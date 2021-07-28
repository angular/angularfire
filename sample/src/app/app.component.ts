import { ApplicationRef, Component, NgZone, Optional } from '@angular/core';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Auth, AuthInstances, authState } from '@angular/fire/auth';
import { Firestore, FirestoreInstances } from '@angular/fire/firestore/lite';
import { firestoreInstance$ } from '@angular/fire/firestore';
import { debounceTime } from 'rxjs/operators';
import { initializeFirestore$ } from './firestore';

@Component({
  selector: 'app-root',
  template: `
    <!--The content below is only a placeholder and can be replaced.-->
    <div style="text-align:center" class="content">
      <h1>
        Welcome to {{title}}!
      </h1>
      <span style="display: block">{{ app.name }} app is running!</span>
      <img width="300" alt="Angular Logo" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj4KICAgIDxwYXRoIGZpbGw9IiNERDAwMzEiIGQ9Ik0xMjUgMzBMMzEuOSA2My4ybDE0LjIgMTIzLjFMMTI1IDIzMGw3OC45LTQzLjcgMTQuMi0xMjMuMXoiIC8+CiAgICA8cGF0aCBmaWxsPSIjQzMwMDJGIiBkPSJNMTI1IDMwdjIyLjItLjFWMjMwbDc4LjktNDMuNyAxNC4yLTEyMy4xTDEyNSAzMHoiIC8+CiAgICA8cGF0aCAgZmlsbD0iI0ZGRkZGRiIgZD0iTTEyNSA1Mi4xTDY2LjggMTgyLjZoMjEuN2wxMS43LTI5LjJoNDkuNGwxMS43IDI5LjJIMTgzTDEyNSA1Mi4xem0xNyA4My4zaC0zNGwxNy00MC45IDE3IDQwLjl6IiAvPgogIDwvc3ZnPg==">
    </div>
    <h2>Here are some links to help you start: </h2>
    <ul>
      <li>
        <h2><a target="_blank" rel="noopener" href="https://angular.io/tutorial">Tour of Heroes</a></h2>
      </li>
      <li>
        <h2><a target="_blank" rel="noopener" href="https://angular.io/cli">CLI Documentation</a></h2>
      </li>
      <li>
        <h2><a target="_blank" rel="noopener" href="https://blog.angular.io/">Angular blog</a></h2>
      </li>
    </ul>
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
  title = 'sample';
  constructor(
    public app: FirebaseApp, // default Firebase App
    public auth: Auth, // default Firbase Auth
    public apps: FirebaseApps, // all initialized App instances
    public authInstances: AuthInstances, // all initialized Auth instances
    @Optional() public firestore: Firestore,
    @Optional() public firestoreInstances: FirestoreInstances,
    appRef: ApplicationRef,
    zone: NgZone,
  ) {
    console.log({app, auth, apps, authInstances, firestore, firestoreInstances });
    // onAuthStateChanged should destablize the zone
    // onAuthStateChanged(auth, it => console.log('onAuthStateChanged', it));
    authState(auth).subscribe(it => console.log('authState', it));
    appRef.isStable.pipe(debounceTime(200)).subscribe(it => console.log('isStable', it));
    console.log((app as any).container.providers.keys());
    firestoreInstance$.subscribe(it => console.log('$', it));
    initializeFirestore$.subscribe(it => console.log('init', it));
  }
}
