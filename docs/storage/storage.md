# Getting started with Cloud Storage

> Cloud Storage is designed to help you quickly and easily store and serve user-generated content, such as photos and videos.

### Import the NgModule

Cloud Storage for AngularFire is contained in the `angularfire2/storage` module namespace. Import the [`AngularFireStorageModule`](../reference/classes/angularfirestoragemodule.md) in your `NgModule`. This sets up the [`AngularFireStorage`](../reference/classes/angularfirestorage.md) service for dependency injection.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { AngularFireStorageModule } from 'angularfire2/storage';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

### Injecting the [`AngularFireStorage`](../reference/classes/angularfirestorage.md) service

Once the [`AngularFireStorageModule`](../reference/classes/angularfirestoragemodule.md) is registered you can inject the [`AngularFireStorage`](../reference/classes/angularfirestorage.md) service.

```ts
import { Component } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-component',
  template: ``
})
export class AppComponent {
  constructor(private storage: AngularFireStorage) { }
}
```

### Uploading blobs

There are three options for uploading files.


| method   |                    |
| ---------|--------------------|
| [`put(data: Blob, metadata?: storage.UploadMetadata): AngularFireUploadTask`](../reference/interfaces/angularfirestoragereference.md#put) | Starts the upload of the blob to the storage reference's path. Returns an `AngularFireUploadTask` for upload monitoring. |
| [`putString(data: string, format?: StringFormat, metadata?: UploadMetadata): AngularFireUploadTask`](../reference/interfaces/angularfirestoragereference.md#putstring) | Updates an existing item in the array. Accepts a key, database reference, or an unwrapped snapshot. |
| [`upload(path: string, data: StringFormat, metadata?: UploadMetadata): AngularFireUploadTask`](../reference/classes/angularfirestorage.md#upload) | Upload or update a new file to the storage reference's path. Returns an `AngularFireUploadTask` for upload monitoring. |

#### Uploading blobs with put

```ts
import { Component } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-root',
  template: `
  <input type="file" (change)="uploadFile($event)">
  `
})
export class AppComponent {
  constructor(private storage: AngularFireStorage) { }
  uploadFile(event) {
    const file = event.target.files[0];
    const filePath = 'name-your-file-path-here';
    const ref = this.storage.ref(filePath);
    const task = ref.put(file);
  }
}
```

#### Uploading blobs with putString

```ts
import { Component } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-root',
  template: `
  <input type="file" (change)="uploadFile($event)">
  `
})
export class AppComponent {
  constructor(private storage: AngularFireStorage) { }
  uploadFile(event) {
    const file = event.target.files[0];
    const filePath = 'name-your-file-path-here';
    const ref = this.storage.ref(filePath);
    const task = ref.putString(file);
  }
}
```

#### Uploading files with upload

```ts
import { Component } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-root',
  template: `
  <input type="file" (change)="uploadFile($event)">
  `
})
export class AppComponent {
  constructor(private storage: AngularFireStorage) { }
  uploadFile(event) {
    const file = event.target.files[0];
    const filePath = 'name-your-file-path-here';
    const task = this.storage.upload(filePath, file);
  }
}
```

### Monitoring upload percentage

An [`AngularFireUploadTask`](../reference/interfaces/angularfireuploadtask.md) has methods for observing upload percentage as well as the final download URL.

| method   |                    |
| ---------|--------------------|
| [`snapshotChanges(): Observable<FirebaseStorage.UploadTaskSnapshot>`](../reference/interfaces/angularfireuploadtask.md#snapshotChanges) | Emits the raw `UploadTaskSnapshot` as the file upload progresses. |
| [`percentageChanges(): Observable<number>`](../reference/interfaces/angularfireuploadtask.md#percentagechanges) | Emits the upload completion percentage. |
| [`getDownloadURL(): Observable<any>`](../reference/interfaces/angularfirestoragereference.md#getdownloadurl) | Emits the download url when available |

#### Example Usage

The method [`getDownloadURL()`](../reference/interfaces/angularfirestoragereference.md#getdownloadurl) is on the [`AngularFireStorageReference`](../reference/interfaces/angularfirestoragereference.md) but isn't available until the upload is complete,to get this we should can utilize the rxjs `finalize` operator:

```ts
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <input type="file" (change)="uploadFile($event)" />
    <div>{{ uploadPercent | async }}</div>
    <a [href]="downloadURL | async">{{ downloadURL | async }}</a>
 `
})
export class AppComponent {
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  constructor(private storage: AngularFireStorage) {}
  uploadFile(event) {
    const file = event.target.files[0];
    const filePath = 'name-your-file-path-here';
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    // observe percentage changes
    this.uploadPercent = task.percentageChanges();
    // get notified when the download URL is available
    task.snapshotChanges().pipe(
        finalize(() => this.downloadURL = fileRef.getDownloadURL() )
     )
    .subscribe()
  }
}
```

### Downloading Files

To download a file you'll need to create a reference and call the [`getDownloadURL()`](../reference/interfaces/angularfirestoragereference.md#getdownloadurl) method on an [`AngularFireStorageReference`](../reference/interfaces/angularfirestoragereference.md).

```ts
@Component({
  selector: 'app-root',
  template: `<img [src]="profileUrl | async" />`
})
export class AppComponent {
  profileUrl: Observable<string | null>;
  constructor(private storage: AngularFireStorage) {
     const ref = this.storage.ref('users/davideast.jpg');
     this.profileUrl = ref.getDownloadURL();
  }
}
```

### Managing Metadata

Cloud Storage for Firebase allows you to upload and download metadata associated with files. This is useful because you can store important metadata and download it without needing to download the entire file.

#### Downloading metadata

```ts
@Component({
  selector: 'app-root',
  template: `<pre><code>{{ meta | async }}</code></pre>`
})
export class AppComponent {
  meta: Observable<any>;
  constructor(private storage: AngularFireStorage) {
     const ref = this.storage.ref('users/davideast.jpg');
     this.meta = ref.getMetadata();
  }
}
```

#### Uploading metadata with files

```ts
@Component({
  selector: 'app-root',
  template: `
    <input type="file" (change)="uploadFile($event)" />
 `
})
export class AppComponent {
  constructor(private storage: AngularFireStorage) {}
  uploadFile(event) {
    const file = event.target.files[0];
    const filePath = 'name-your-file-path-here';
    const ref = this.storage.ref(filePath);
    const task = ref.put(file, { customMetadata: { blah: 'blah' } });
  }
}
```
