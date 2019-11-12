import { Component } from '@angular/core';

import { FirebaseApp } from '@angular/fire';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFirePerformance } from '@angular/fire/performance';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ng7';
  constructor(
    private readonly app: FirebaseApp,
    private readonly db: AngularFireDatabase,
    private readonly auth: AngularFireAuth,
    private readonly afStore: AngularFirestore,
    private readonly storage: AngularFireStorage,
    private readonly messaging: AngularFireMessaging,
    private readonly functions: AngularFireFunctions,
    private readonly perf: AngularFirePerformance
  ) {
    console.log(app, db, auth, afStore, storage, messaging, functions, perf);
  }
}
