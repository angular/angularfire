import { NgModule } from '@angular/core';
import { AngularFirestore } from './firestore';

@NgModule({
  providers: [ AngularFirestore ]
})
export class AngularFirestoreModule {
  // firebase/firestore/memory does not have persistence capabilities
}
