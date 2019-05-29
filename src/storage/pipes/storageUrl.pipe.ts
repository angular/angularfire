import { Pipe } from '@angular/core'
import { AngularFireStorage } from '../storage';

/** to be used with in combination with | async */
@Pipe({
  name: 'ngfbStorageUrl'
}) export class AngularFirestoreStorageUrl {
  constructor(public storage:AngularFireStorage){}

  transform(path) {
    return this.storage.ref(path).getDownloadURL()
  }
}
