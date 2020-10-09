import { Component } from '@angular/core';
import { FirebaseApp } from '@angular/fire';

@Component({
  selector: 'app-home',
  template: `
    Hello world!
    {{ firebaseApp.name }}
    <app-database></app-database>
    <app-firestore></app-firestore>
    <app-remote-config></app-remote-config>
    <app-storage></app-storage>
    <app-auth></app-auth>
    <app-messaging></app-messaging>
  `,
  styles: [``]
})
export class HomeComponent {
  constructor(public readonly firebaseApp: FirebaseApp) {
  }
}
