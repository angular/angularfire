import { ApplicationRef, Component } from '@angular/core';
import { FirebaseApp } from '@angular/fire';

@Component({
  selector: 'app-root',
  template: `
    Hello world!
    {{ firebaseApp.name }}
    <app-database></app-database>
    <app-firestore></app-firestore>
    <app-remote-config></app-remote-config>
    <app-storage></app-storage>
  `,
  styles: [``]
})
export class AppComponent {
  title = 'sample';
  constructor(public readonly firebaseApp: FirebaseApp, appRef: ApplicationRef) {
    appRef.isStable.subscribe(it => console.log('isStable', it));
  }
}
