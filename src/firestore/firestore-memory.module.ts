import { NgModule } from '@angular/core';
import { AngularFirestore } from './firestore';

import 'firebase/firestore/memory';

@NgModule({
  providers: [ AngularFirestore ]
})
export class AngularFirestoreModule {
  // firebase/firestore/memory does not have persistence capabilities
}
