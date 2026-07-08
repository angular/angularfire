import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DatabaseComponent } from './database/database.component';
import { FirestoreComponent } from './firestore/firestore.component';
import { FunctionsComponent } from './functions/functions.component';
import { MessagingComponent } from './messaging/messaging.component';
import { RemoteConfigComponent } from './remote-config/remote-config.component';
import { StorageComponent } from './storage/storage.component';
import { UpboatsComponent } from './upboats/upboats.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AuthComponent,
    DatabaseComponent,
    FirestoreComponent,
    FunctionsComponent,
    MessagingComponent,
    RemoteConfigComponent,
    StorageComponent,
    UpboatsComponent
  ],
  template: `
    Hello World!
    <app-auth />
    @defer (hydrate on idle) { <app-database /> } @placeholder { Database! &hellip; }
    @defer (hydrate on idle) { <app-firestore /> } @placeholder { Firestore! &hellip; }
    @defer (hydrate on idle) { <app-functions /> } @placeholder { Functions! &hellip; }
    @defer (hydrate on idle) { <app-messaging /> } @placeholder { Messaging! &hellip; }
    @defer (hydrate on idle) { <app-remote-config /> } @placeholder { Remote Config! &hellip; }
    @defer (hydrate never) { <app-storage /> } @placeholder { Storage! &hellip; }
    @defer (hydrate on idle) { <app-upboats /> } @placeholder { &hellip; }
    <router-outlet />
  `,
})
export class AppComponent {
  title = 'ng19-test';
}
