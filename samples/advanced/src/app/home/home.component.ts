import { Component, Inject, Optional } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { Response } from 'express';
import { RESPONSE } from '../../express.tokens';
import { FunctionsComponent } from '../functions/functions.component';
import { StorageComponent } from '../storage/storage.component';
import { RemoteConfigComponent } from '../remote-config/remote-config.component';
import { MessagingComponent } from '../messaging/messaging.component';
import { FirestoreComponent } from '../firestore/firestore.component';
import { DatabaseComponent } from '../database/database.component';
import { AppCheckComponent } from '../app-check/app-check.component';
import { AuthComponent } from '../auth/auth.component';
import { UpboatsComponent } from '../upboats/upboats.component';

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
    standalone: true,
    imports: [
        UpboatsComponent,
        AuthComponent,
        AppCheckComponent,
        DatabaseComponent,
        FirestoreComponent,
        MessagingComponent,
        RemoteConfigComponent,
        StorageComponent,
        FunctionsComponent,
    ],
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
