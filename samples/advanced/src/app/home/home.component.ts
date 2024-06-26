import { Component, Inject, Optional } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { Response } from 'express';
import { RESPONSE } from '@nguniversal/express-engine/tokens';

@Component({
  selector: 'app-home',
  template: `
    Hello world!
    {{ firebaseApp.name }}
    <app-upboats></app-upboats>
    <app-auth></app-auth>
    <app-app-check></app-app-check>
    <app-database></app-database>
    <app-firestore></app-firestore>
    <app-messaging></app-messaging>
    <app-remote-config></app-remote-config>
    <app-storage></app-storage>
    <app-functions></app-functions>
  `,
})
export class HomeComponent {
  constructor(
    public readonly firebaseApp: FirebaseApp,
    @Optional() @Inject(RESPONSE) response: Response,
  ) {
    if (response) {
      response.setHeader('Cache-Control', 'public,max-age=600');
    }
  }
}
