import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { trace } from '@angular/fire/compat/performance';
import { AngularFirestore } from '@angular/fire/compat/firestore';

type Animal = { name: string, upboats: number, id: string, hasPendingWrites: boolean };

@Component({
  selector: 'app-upboats',
  templateUrl: './upboats.component.html',
  styleUrls: ['./upboats.component.css']
})
export class UpboatsComponent implements OnInit {

  public animals: Observable<Animal[]>;

  constructor(private firestore: AngularFirestore) {
    const collection = firestore.collection<Animal>('animals', ref =>
      ref.orderBy('upboats', 'desc').orderBy('updatedAt', 'desc')
    );
    const key = makeStateKey<Animal[]>(collection.ref.path);
    this.animals = collection.snapshotChanges().pipe(
      trace('animals'),
      map(it => it.map(change => ({
        ...change.payload.doc.data(),
        id: change.payload.doc.id,
        hasPendingWrites: change.payload.doc.metadata.hasPendingWrites
      }))),
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
