import { Component } from '@angular/core';
import { FirebaseApp } from '@angular/fire';

@Component({
  selector: 'app-home',
  template: `
    Hello world!
    {{ firebaseApp.name }}
    <!-- TODO wrap the Zone issue <app-database></app-database> -->
    <app-firestore></app-firestore>
    <app-storage></app-storage>
    <app-auth></app-auth>
    <app-remote-config></app-remote-config>
    <app-messaging></app-messaging>
    <app-functions></app-functions>
  `,
  styles: [``]
})
export class HomeComponent {
  constructor(public readonly firebaseApp: FirebaseApp) {}
}
