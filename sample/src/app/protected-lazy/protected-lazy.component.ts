import { Component, OnInit } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '../../firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-protected-lazy',
  templateUrl: './protected-lazy.component.html',
  styleUrls: ['./protected-lazy.component.css']
})
export class ProtectedLazyComponent implements OnInit {

  public snapshot: Observable<DocumentChangeAction<unknown>[]>;

  constructor(private afs: AngularFirestore) {
    this.snapshot = afs.collection('test').snapshotChanges();
  }

  ngOnInit(): void {
  }

}
