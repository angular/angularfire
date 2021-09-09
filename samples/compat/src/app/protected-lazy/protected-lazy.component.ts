import { Component, OnInit } from '@angular/core';
import { DocumentChangeAction } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AngularFirestoreOffline } from '../firestore-offline/firestore-offline.module';

@Component({
  selector: 'app-protected-lazy',
  templateUrl: './protected-lazy.component.html',
  styleUrls: ['./protected-lazy.component.css']
})
export class ProtectedLazyComponent implements OnInit {

  public snapshot: Observable<DocumentChangeAction<unknown>[]>;

  constructor(private afs: AngularFirestoreOffline) {
    this.snapshot = afs.collection('test').snapshotChanges();
  }

  ngOnInit(): void {
  }

}
