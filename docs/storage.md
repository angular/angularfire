<img align="right" width="30%" src="images/storage-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Realtime Cloud Storage
</small>

# Cloud Storage

## Features of storage

1. [Add any file to the cloud storage](#adding-files)
2. [Delete the file](#deleting-a-file-from-storage)
3. [Get a download link](#get-download-url-of-uploaded-file)
4. [Set file metadata](#setting-custom-metadata-with-files)
5. [List all Files](#list-all-files)
6. [Paginate file list](#paginate-list-results)
### First let's initialize our storage api

File `app.module.ts`

```ts
import { provideStorage,getStorage } from '@angular/fire/storage';

@NgModule({
    imports:[
        provideStorage(() => getStorage())
    ]
})
```

#### Inject it in our component or service (Recommended) file.

```ts
import { Storage } from "@angular/fire/storage";
export class StorageComponent {
  constructor(private storage: Storage) {}
}
```

### Uploading files and data

To upload the data to firebase storage we are going to use the `uploadBytesResumable()`

So let's create a random text file named `data.txt` in assets folder of angular root directory with any data in it.

```text
Lorem ipsum dolor sit amet, consectetur
adipiscing elit. Quisque nibh nisi,
tincidunt vel facilisis pretium, varius digni ssim
...
```

Now let's write logic and implementation

```ts
import { Storage, ref, uploadBytes } from "@angular/fire/storage";
@Component({
  selector: "app-storage",
  template: '<input type="file" (change)="upload($event)">',
})
export class StorageComponent {
  constructor(private storage: Storage) {}
  upload(event: any) {
    if (event.files.length > 0) {
      const storageRef = ref(this.storage, "images/data.txt");
      uploadBytes(storageRef, event.files[0]).then((data) => {
        console.log("File uploaded");
        alert("File uploaded");
      });
    }
  }
}
```

Here the `uploadBytes` function takes two arguments one is a `storageRef` aka storage reference and another is `File` or `Blob` or `Uint8Array` or `ArrayBuffer` and an optional argument `metadata` to include additional metadata with your file.

This function returns a `Promise` object with [`UploadResult`](https://firebase.google.com/docs/reference/js/storage.uploadresult) data in it.

### Get progress of the current upload status

You may want to get the upload percentage of the file while you are uploading. Firebase storage provides `percentage()` method which will return an `Observable` with two data inside it. One is progress another is `UploadTaskSnapshot`.

But to do this we need to use `uploadBytesResumable()` function which returns a task.

```ts
import { Storage, ref, uploadBytesResumable } from "@angular/fire/storage";
@Component({
  selector: "app-storage",
  template: `<input type="file" (change)="upload($event)" />
    <p>Uploaded {{ uploadPercentage }}</p>`,
})
export class StorageComponent implements OnDestroy {
  uploadPercentage: number = 0;
  percentageSubscription: Subscription = Subscription.EMPTY;
  constructor(private storage: Storage) {}
  ngOnDestroy() {
    percentageSubscription.unsubscribe();
  }
  upload(event: any) {
    if (event.files.length > 0) {
      const storageRef = ref(this.storage, "images/data.txt");
      const uploadTask = uploadBytesResumable(storageRef, event.files[0]);
      uploadTask.then((data) => {
        console.log("File uploaded");
        alert("File uploaded");
      });
      // Percentage observer
      this.percentageSubscription = percentage(task).subscribe((percentage) => {
        this.uploadPercentage = percentage.progress;
      });
    }
  }
}
```

### Get download url of uploaded file

We can get the download URL of the `File` which has been uploaded. So that you can store it in a database for future reference.

```ts
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "@angular/fire/storage";
@Component({
  selector: "app-storage",
  template: `<input type="file" (change)="upload($event)" />
    <p>Uploaded URL {{ uploadURL }}</p>`,
})
export class StorageComponent {
  uploadURL: string = "";
  constructor(private storage: Storage) {}
  upload(event: any) {
    if (event.files.length > 0) {
      const storageRef = ref(this.storage, "images/data.txt");
      const uploadTask = uploadBytesResumable(storageRef, event.files[0]);
      uploadTask.then((data) => {
        console.log("File uploaded");
        alert("File uploaded");
      });
      // Download url
      getDownloadURL(storageRef).then((url) => {
        this.uploadURL = url;
      });
    }
  }
}
```

### Deleting a file from storage

You may want to delete some data or a file from the firebase storage. Firestore provides `deleteObject()` function which can delete any file reference.

```ts
import {deleteObject} from "@angular/fire/storage";
...
const storageRef = ref(this.storage, "images/data.txt");
deleteObject(storageRef).then(()=>console.log('Deleted'))
```

### Setting custom metadata with files.

After uploading a file to Cloud Storage reference, you can also get or update the file metadata, for example to update the content type. Files can also store custom key/value pairs with additional file metadata.

> Note: By default, a Cloud Storage bucket requires Firebase Authentication to perform any action on the bucket's data or files. You can change your Firebase Security Rules for Cloud Storage to allow unauthenticated access. Since Firebase and your project's default App Engine app share this bucket, configuring public access may make newly uploaded App Engine files publicly accessible, as well. Be sure to restrict access to your Cloud Storage bucket again when you set up Authentication.

#### Get file metadata

File metadata contains common properties such as name, size, and `contentType` (often referred to as MIME type) in addition to some less common ones like `contentDisposition` and `timeCreated`. This metadata can be retrieved from a Cloud Storage reference using the `getMetadata()` method. `getMetadata()` returns a Promise containing the complete metadata, or an error if the Promise rejects.

```ts
const newMetaData = {
  cacheControl: 'public,max-age=300',
  contentType: 'image/jpeg'
};
// Set metadata while uploading
...
const uploadTask = uploadBytesResumable(storageRef, event.files[0],metadata:newMetaData);

// Update metadata after the files is uploaded

import { updateMetadata } from '@angular/fire/storage';
...
const storageRef = ref(this.storage, "images/data.txt");
updateMetadata(storageRef,newMetaData)

// Get metadata of a file

import { getMetadata } from '@angular/fire/storage';
...
const storageRef = ref(this.storage, "images/data.txt");
getMetadata(storageRef).then((metadata)=>{
  // Metadata now contains the metadata for 'images/data.txt'
}).catch((error) => {
    // Uh-oh, an error occurred!
});

```

### File metadata properties

<table>
  <tbody><tr>
    <th>Property</th>
    <th>Type</th>
    <th>Writable</th>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">bucket</code></td>
    <td>string</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">generation</code></td>
    <td>string</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">metageneration</code></td>
    <td>string</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">fullPath</code></td>
    <td>string</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">name</code></td>
    <td>string</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">size</code></td>
    <td>number</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">timeCreated</code></td>
    <td>string</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">updated</code></td>
    <td>string</td>
    <td>NO</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">md5Hash</code></td>
    <td>string</td>
    <td>YES on upload, NO on updateMetadata</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">cacheControl</code></td>
    <td>string</td>
    <td>YES</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">contentDisposition</code></td>
    <td>string</td>
    <td>YES</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">contentEncoding</code></td>
    <td>string</td>
    <td>YES</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">contentLanguage</code></td>
    <td>string</td>
    <td>YES</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">contentType</code></td>
    <td>string</td>
    <td>YES</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">customMetadata</code></td>
    <td>Object containing string-&gt;string mappings</td>
    <td>YES</td>
  </tr>
</tbody></table>

## List files with Cloud Storage on Web

Cloud Storage for Firebase allows you to list the contents of your Cloud Storage bucket. The SDKs return both the items and the prefixes of objects under the current Cloud Storage reference.

Projects that use the List API require Cloud Storage for Firebase Rules Version 2. If you have an existing Firebase project, follow the steps in the Security Rules Guide.

> Note: The List API is only allowed for Rules version 2. In Rules version 2, allow read is the shorthand for allow get, list.

### List all files

You can use `listAll` to fetch all results for a directory. This is best used for small directories as all results are buffered in memory. The operation also may not return a consistent snapshot if objects are added or removed during the process.

For a large list, use the paginated `list()` method as `listAll()` buffers all results in memory.

The following example demonstrates `listAll`.

```ts
import { Storage, ref, listAll } from "@angular/fire/storage";
@Component({
  selector: "app-storage",
  template: `<p>Check console</p>`,
})
export class StorageComponent implements OnInit {
  constructor(private storage: Storage) {}
  ngOnInit() {
    const storageRef = ref(this.storage, "images");
    listAll(storageRef)
      .then((data) => {
        data.prefixes.forEach((prefix) => {
          console.log(prefix);
          // All the prefixes under listRef.
          // You may call listAll() recursively on them.
        });
        data.items.forEach((item) => {
          console.log(item);
          // All the items under listRef.
        });
      })
      .catch((error) => {
        console.error(error);
        // Uh-oh, an error occurred!
      });
  }
}
```

## Paginate list results

The `list()` API places a limit on the number of results it returns. `list()` provides a consistent pageview and exposes a `pageToken` that allows control over when to fetch additional results.

The `pageToken` encodes the path and version of the last item returned in the previous result. In a subsequent request using the `pageToken`, items that come after the `pageToken` are shown.

The following example demonstrates paginating a result using async/await.

This method will only return you first 10 results.

```ts
list(storageRef, { maxResults: 10 });
```

Full Example Below

```ts
import { getStorage, ref, list } from "firebase/storage";
@Component({
  selector: "app-storage",
  template: `<p>Check console</p>`,
})
export class StorageComponent implements OnInit {
  constructor(private storage: Storage) {}
  ngOnInit() {
    const storageRef = ref(this.storage, "images");
    list(storageRef, { maxResults: 10 })
      .then((data) => {
        data.prefixes.forEach((prefix) => {
          console.log(prefix);
          // All the prefixes under listRef.
          // You may call listAll() recursively on them.
        });
        data.items.forEach((item) => {
          console.log(item);
          // All the items under listRef.
        });
      })
      .catch((error) => {
        console.error(error);
        // Uh-oh, an error occurred!
      });
  }
}
```

## Handle Error Messages

There are a number of reasons why errors may occur, including the file not existing, the user not having permission to access the desired file, or the user cancelling the file upload.

To properly diagnose the issue and handle the error, here is a full list of all the errors our client will raise, and how they occurred.

<table>
  <tbody><tr>
    <th>Code</th>
    <th>Reason</th>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>unknown</code></td>
    <td>An unknown error occurred.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>object-not-found</code></td>
    <td>No object exists at the desired reference.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>bucket-not-found</code></td>
    <td>No bucket is configured for Cloud Storage</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>project-not-found</code></td>
    <td>No project is configured for Cloud Storage</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>quota-exceeded</code></td>
    <td>Quota on your Cloud Storage bucket has been exceeded.
        If you're on the no-cost tier, upgrade to a paid plan. If you're on
        a paid plan, reach out to Firebase support.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>unauthenticated</code></td>
    <td>User is unauthenticated, please authenticate and try again.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>unauthorized</code></td>
    <td>User is not authorized to perform the desired action, check your
        security rules to ensure they are correct.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>retry-limit-exceeded</code></td>
    <td>The maximum time limit on an operation (upload, download, delete, etc.)
        has been excceded. Try uploading again.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>invalid-checksum</code></td>
    <td>File on the client does not match the checksum of the file received
        by the server. Try uploading again.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>canceled</code></td>
    <td>User canceled the operation.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>invalid-event-name</code></td>
    <td>Invalid event name provided. Must be one of
    [<code translate="no" dir="ltr">`running`</code>, <code translate="no" dir="ltr">`progress`</code>, <code translate="no" dir="ltr">`pause`</code>]</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>invalid-url</code></td>
    <td>Invalid URL provided to <code translate="no" dir="ltr">refFromURL()</code>. Must be of the form:
        gs://bucket/object or https://firebasestorage.googleapis.com/v0/b/bucket/o/object?token=&lt;TOKEN&gt;</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>invalid-argument</code></td>
    <td>The argument passed to <code translate="no" dir="ltr">put()</code> must be `File`, `Blob`, or
        `UInt8` Array. The argument passed to <code translate="no" dir="ltr">putString()</code> must be
        a raw, `Base64`, or `Base64URL` string.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>no-default-bucket</code></td>
    <td>No bucket has been set in your config's
        <code translate="no" dir="ltr">storageBucket</code> property.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>cannot-slice-blob</code></td>
    <td>Commonly occurs when the local file has changed (deleted, saved again,
        etc.). Try uploading again after verifying that the file hasn't
        changed.</td>
  </tr>
  <tr>
    <td><code translate="no" dir="ltr">storage/<wbr>server-file-wrong-size</code></td>
    <td>File on the client does not match the size of the file recieved by the
        server. Try uploading again.</td>
  </tr>
</tbody></table>
