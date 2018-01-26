# AngularFireStorage

> Cloud Storage is designed to help you quickly and easily store and serve user-generated content, such as photos and videos.

### Import the NgModule

Cloud Storage for AngularFire is contained in the `angularfire2/storage` module namespace. Import the `AngularFireStorageModule` in your `NgModule`. This sets up the `AngularFireStorage` service for dependency injection.

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

### Injecting the AngularFireStorage service

Once the `AngularFireStorageModule` is registered you can inject the `AngularFireStorage` service.

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

There are two options for uploading files. 

| method   |                    | 
| ---------|--------------------| 
| `put(data: Blob, metadata?: storage.UploadMetadata): AngularFireUploadTask` | Starts the upload of the blob to the storage reference's path. Returns an `AngularFireUploadTask` for upload monitoring. | 
| `putString(keyRefOrSnap: string, value: T) | Firebase | AFUnwrappedSnapshot, value: Object)` | Updates an existing item in the array. Accepts a key, database reference, or an unwrapped snapshot. |

```ts
import { Component } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-root',
  template: `
  <input type="file" (onchange)="uploadFile($event)">
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

An `AngularFireUploadTask` has methods for observing upload percentage as well as the final download URL.

| method   |                    | 
| ---------|--------------------| 
| `snapshotChanges(): Observable<FirebaseStorage.UploadTaskSnapshot>` | Emits the raw `UploadTaskSnapshot` as the file upload progresses. | 
| `percentageChanges(): Observable<number>` | Emits the upload completion percentage. | 
| `downloadURL(): Observable<string>` | Emits the download url when available |

#### Example Usage

```ts
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
    const task = this.storage.upload(filePath, file);
    
    // observe percentage changes
    this.uploadPercent = task.percentageChanges();
    // get notified when the download URL is available
    this.downloadURL = task.downloadURL();
  }
}
```

### Downloading Files

To download a file you'll need to create a reference and call the `getDownloadURL()` method on an `AngularFireStorageReference`.

```ts
@Component({
  selector: 'app-root',
  template: `<img [src]="profileUrl | async" />`
})
export class AppComponent {
  profileUrl: Observable<string | null>;
  constructor(private storage: AngularFireStorage) {
     const ref = this.storage.ref('users/davideast.jpg');
     this.profileUrl = ref.getDownloadUrl();
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
