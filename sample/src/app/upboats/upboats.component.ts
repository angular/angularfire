import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFirestoreOffline } from '../firestore-offline/firestore-offline.module';
import firebase from 'firebase/app';

type Animal = { name: string, upboats: number, id: string, hasPendingWrites: boolean };

@Component({
  selector: 'app-upboats',
  templateUrl: './upboats.component.html',
  styleUrls: ['./upboats.component.css']
})
export class UpboatsComponent implements OnInit {

  public animals: Observable<Animal[]>;

  constructor(private firestore: AngularFirestoreOffline) {
    this.animals = firestore.collection<Animal>('animals', ref =>
      ref.orderBy('upboats', 'desc').orderBy('updatedAt', 'desc')
    ).snapshotChanges().pipe(
      map(it => it.map(change => ({
        ...change.payload.doc.data(),
        id: change.payload.doc.id,
        hasPendingWrites: change.payload.doc.metadata.hasPendingWrites
      })))
    );
  }

  ngOnInit(): void {
  }

  upboat(id: string) {
    // TODO add rule
    this.firestore.doc(`animals/${id}`).update({
      upboats: firebase.firestore.FieldValue.increment(1),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  downboat(id: string) {
    // TODO add rule
    this.firestore.doc(`animals/${id}`).update({
      upboats: firebase.firestore.FieldValue.increment(-1),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  newAnimal() {
    // TODO add rule
    this.firestore.collection('animals').add({
      name: prompt('Can haz name?'),
      upboats: 1,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

}
