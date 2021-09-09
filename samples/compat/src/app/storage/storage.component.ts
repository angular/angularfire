import { Component, OnInit } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { trace } from '@angular/fire/compat/performance';

const TRANSPARENT_PNG
  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

@Component({
  selector: 'app-storage',
  template: `
    <p>
      Storage!
      <img [src]="downloadUrl$ | async" width="64" height="64" />
      <br><small>{{ 'google-g.png' | getDownloadURL | json }}</small>
    </p>
  `,
  styles: []
})
export class StorageComponent implements OnInit {

  public readonly downloadUrl$: Observable<string>;

  constructor(storage: AngularFireStorage) {
    const icon = storage.ref('google-g.png');
    this.downloadUrl$ = icon.getDownloadURL().pipe(
      trace('storage'),
      startWith(TRANSPARENT_PNG)
    );
  }

  ngOnInit(): void {
  }

}
