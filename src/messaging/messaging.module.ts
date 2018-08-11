import { NgModule } from '@angular/core';
import { AngularFireModule, FirebaseApp } from 'angularfire2';
import { AngularFireMessaging } from './messaging';
import 'firebase/messaging';

@NgModule({
  providers: [ AngularFireMessaging ]
})
export class AngularFireMessagingModule { }
