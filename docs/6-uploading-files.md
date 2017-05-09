# 6. Uploading Files

`AngularFireStorage.upload` provides you an `Observable<firebase.storage.UploadTaskSnapshot>` to upload files to [Firebase Storage](https://firebase.google.com/docs/storage/) and monitor progress.

`AngularFireStorage.storage` returns an initialized
`firebase.storage.Storage` instance, so you can perform operations other than upload. [See
the Firebase docs for more information on what methods are availabile.](https://firebase.google.com/docs/reference/js/firebase.storage.Storage)

## API:

```ts
AngularFireStorage.upload(
  pathOrRef: string | firebase.storage.Reference,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata: firebase.storage.UploadMetadata = {}
) : FirebaseUploadTaskObservable<firebase.storage.UploadTaskSnapshot>

AngularFireStorage.storage : firebase.storage.Storage

FirebaseUploadTaskObservable extends Observable<UploadTaskSnapshot>
FirebaseUploadTaskObservable.cancel() : Boolean
FirebaseUploadTaskObservable.pause() : Boolean
FirebaseUploadTaskObservable.resume() : Boolean
FirebaseUploadTaskObservable.uploadTask : firebase.storage.UploadTask 
```

## Use:

```ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {

  task: FirebaseUploadTaskObservable<firebase.storage.UploadTaskSnapshot>;
  state: Observable<String>;
  uploading: Observable<Boolean>;
  success: Observable<Boolean>;
  percentage: Observable<number>;

  constructor(private afAuth: AngularFireAuth, private afStorage: AngularFireStorage) {
    afStorage.storage.setMaxUploadRetryTime(1000)
  }

  upload(event) {
    const file = event.srcElement.files[0];

    this.task = this.afStorage.upload(`/uploads/${file.name}`, file, {
      customMetadata: {
        uid: this.afAuth.auth.currentUser.uid
      }
    });

    this.state = task.map(s => s.state);
    this.uploading = state.map(s => s === firebase.storage.TaskState.RUNNING);
    this.success = state.map(s => s === firebase.storage.TaskState.SUCCESS);
    this.percentage = task.map(s => s.bytesTransferred / s.totalBytes * 100);
  }
  
  pause(event) {
    task.pause();
  }

  resume(event) {
    task.resume();
  }

  cancel(event) {
    task.cancel();
  }
}
```