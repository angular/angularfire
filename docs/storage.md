<img align="right" width="30%" src="images/storage-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Realtime Cloud Storage
</small>

# Cloud Storage

Cloud Storage allows developers to upload and share user generated content such as images, video and more. Data is stored in Google Cloud Storage. 

[Learn more](https://firebase.google.com/docs/storage)

## Dependency Injection

AngularFire allows you to work with Firebase Storage via Angular's Dependency Injection.

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Firebase Storage instance in the application's `NgModule` (`app.module.ts`):

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getStorage, provideStorage } from '@angular/fire/storage';

@NgModule({
  imports: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideStorage(() => getStorage()),
  ]
})
```

Next inject it into your component:

```ts
import { Component, inject} from '@angular/core';
import { Storage } from '@angular/fire/storage';

@Component({ ... })
export class StorageComponent {
  private storage: Storage = inject(Storage);
  ...
}
```


## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/storage'` to `import { ... } from '@angular/fire/storage'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/storage/web/start) | [API Reference](https://firebase.google.com/docs/reference/js/storage)

## File Upload Example

```ts
import { Component, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable } from '@angular/fire/storage';

@Component({
    selector: 'app-storage',
    template: `
        <h1>Storage</h1>
        <label for="fileUpload">Choose a File</label>
        <input id="fileUpload" type="file" #upload>
        <button (click)="uploadFile(upload)">Upload</button>
    `,
})
export class StorageComponent {
    private readonly storage: Storage = inject(Storage);

    uploadFile(input: HTMLInputElement) {
        if (!input.files) return

        const files: FileList = input.files;

        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (file) {
                const storageRef = ref(this.storage, file.name);
                uploadBytesResumable(storageRef, file);
            }
        }
    }
}
```
