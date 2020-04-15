import { Component, ApplicationRef } from '@angular/core';
import { FirebaseApp } from '@angular/fire';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [``]
})
export class AppComponent {
  constructor(public readonly firebaseApp: FirebaseApp, appRef: ApplicationRef) {
    appRef.isStable.subscribe(it => console.log('isStable', it));
  }
}
