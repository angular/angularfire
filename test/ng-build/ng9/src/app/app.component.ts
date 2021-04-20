import { Component, ApplicationRef } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { FirebaseApp } from '@angular/fire';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AngularFirePerformance } from '@angular/fire/compat/performance';
import { canActivate, loggedIn } from '@angular/fire/auth-guard';
import { AngularFireRemoteConfig } from '@angular/fire/compat/remote-config';

import 'firebase/compat/database';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ng8';
  constructor(
    private readonly analytics: AngularFireAnalytics,
    private readonly app: FirebaseApp,
    private readonly db: AngularFireDatabase,
    private readonly auth: AngularFireAuth,
    private readonly afStore: AngularFirestore,
    private readonly storage: AngularFireStorage,
    private readonly messaging: AngularFireMessaging,
    private readonly functions: AngularFireFunctions,
    private readonly performance: AngularFirePerformance,
    private readonly remoteConfig: AngularFireRemoteConfig,
    private readonly appRef: ApplicationRef
  ) {
    const authArgs = canActivate(() => loggedIn);
    console.log(analytics, app, db, auth, afStore, storage, messaging, functions, remoteConfig, performance, authArgs);
    appRef.isStable.subscribe(it => console.log('isStable', it));
  }
}
