# AngularFire Inicio Rápido

### 1. Crea un nuevo proyecto

```bash
npm install -g @angular/cli
ng new <project-name>
cd <project-name>
```

El comando `new` del CLI de Angular configurará la última compilación de Angular en una nueva estructura de proyecto.

### 2. Instala AngularFire y Firebase

```bash
ng add @angular/fire
```

Ahora que tiene un nuevo proyecto configurado, instala AngularFire y Firebase desde npm.

### 3. Agrega la configuración de Firebase en las variables de entorno.

Abra `/src/environments/environment.ts` y agregua tu configuración de Firebase. Puede encontrar la configuración de tu proyecto en [Firebase Console](https://console.firebase.google.com). Haz clic en el icono de engranaje junto a Descripción general del proyecto, en la sección Sus aplicaciones, crea una nueva aplicación y elije el tipo Web. Asigna un nombre a la aplicación y copia los valores de configuración proporcionados.

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: '<your-key>',
    authDomain: '<your-project-authdomain>',
    databaseURL: '<your-database-URL>',
    projectId: '<your-project-id>',
    storageBucket: '<your-storage-bucket>',
    messagingSenderId: '<your-messaging-sender-id>',
    appId: '<your-app-id>',
    measurementId: '<your-measurement-id>'
  }
};
```

### 4. Configura `@NgModule` para `AngularFireModule`

Abra `/src/app/app.module.ts`, inyecta los `providers` de Firebase y especifica tu configuración de Firebase.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase)
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

### 5. Configuración individual de `@NgModule`s

Después de agregar AngularFireModule, también debes agregar módulos para los @NgModules individuales que necesita tu aplicación.

Por ejemplo, si tu aplicación usaba tanto Google Analytics como Firestore, agregaría `AngularFireAnalyticsModule`.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule,
    AngularFirestoreModule
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

### 7. Inyecta `AngularFirestore`

Abre `/src/app/app.component.ts` y asegúrate de modificar/eliminar cualquier prueba para que la muestra funcione (las pruebas siguen siendo importantes, tu lo sabes):

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(firestore: AngularFirestore) {

  }
}
```

### 8. Une una colección de Firebase a tu lista

En `/src/app/app.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  items: Observable<any[]>;
  constructor(firestore: AngularFirestore) {
    this.items = firestore.collection('items').valueChanges();
  }
}
```

Abre `/src/app/app.component.html`:

```html
<ul>
  <li class="text" *ngFor="let item of items | async">
    {{item.name}}
  </li>
</ul>
```

### 9. Ejecuta tu aplicación localmente

```bash
ng serve
```

Tu aplicación Angular se compilará y servirá localmente, visítela, deberíamos ver una lista vacía.

En otra pestaña [comienza a agregar datos a una colección de 'items' en Firestore] (https://firebase.google.com/docs/firestore/manage-data/add-data). *Como aún no estamos autenticando a los usuarios, asegúrate de iniciar Firestore en **modo de prueba** o permitir la lectura de la colección de `items` en Reglas de seguridad (`allow read: if true`).*

Una vez que hayas creado una colección de `items` y estés insertando documentos, debería ver la transmisión de datos en su aplicación Angular.

### 10. Despliega tu app

Finalmente podemos desplegar la aplicación a Firebase hosting:

```bash
ng deploy
```