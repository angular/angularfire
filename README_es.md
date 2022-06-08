# AngularFire
La librería oficial de [Angular](https://angular.io/) para [Firebase](https://firebase.google.com/).

```bash
ng add @angular/fire
```

## ¿Qué es AngularFire?

- **Observable based** - Usa el poder de RxJS, Angular y Firebase.
- **Realtime bindings** - Sincroniza datos en tiempo real.
- **Authentication** - Inicia sesión con una variedad de proveedores, y monitorea el estado de la autenticación.
- **Offline Data** - Almacena datos offline automáticamente con AngularFirestore.
- **Server-side Render** - Genera HTML estático para aumentar el rendimiento o crear sitios estáticos.
- **ngrx friendly** - Integre con ngrx utilizando las APIs basadas en acciones de AngularFire.
- **Manage binary data** - Carga, descarga y elimina archivos binarios como imágenes, videos y otros blobs.
- **Call server code** - LLama directamente Cloud Functions, sin servidores de por medio y pasasndo el contexto usuario automáticamente.
- **Push notifications** - Registra y escucha notifiaciones push.
- **Modular** - Incluye solo que necesitas. Ningún paquete de AngularFire sobrepasa los 4kb, la mayoria por debajo de 2kb (gzipped).

## Inicio Rápido

Levanta y ejecuta tu primera aplicación solo siguiendo nuestra [guía de inicio rápido](docs/install-and-setup_es.md). (en proceso de traducción)

## Ejemplo de uso:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
      {{ item.name }}
    </li>
  </ul>
  `
})
export class MyApp {
  items: Observable<any[]>;
  constructor(firestore: AngularFirestore) {
    this.items = firestore.collection('items').valueChanges();
  }
}
```

## Recursos

[Contribuyendo](CONTRIBUTING.md) (en proceso de traducción).

[Plantilla Stackblitz](https://stackblitz.com/edit/angular-fire-start) - Recuerda colocar tu configuración de Firebase en `app/app.module.ts`.

[¿Actualizando a v6.0? Mira nuestra guía.](docs/version-6-upgrade.md). (en proceso de traducción)

**¿Tienes problemas?** Obtén ayuda en el [Firebase Mailing List](https://groups.google.com/forum/#!forum/firebase-talk) (apoyado oficialmente), la [Comunidad Firebase en Slack](https://firebase.community/) (busca en el canal `#angularfire2`), [Gitter](https://gitter.im/angular/angularfire2), o [Stack Overflow](https://stackoverflow.com/questions/tagged/angularfire2).

## Guía de Desarrolladores

### **NUEVO:** Monitorea el uso de tu aplicación en producción

> `AngularFireAnalytics` provee un método conviente para interactuar con Google Analytics en tu aplicación Angular. `ScreenTrackingService` y `UserTrackingService` registran eventos automáticamente cuando estás usando el Router de Angular o Firebase Authentication respectivamente. [Conoce más sonre Google Analytics](https://firebase.google.com/docs/analytics).

- [Comenzando con Google Analytics](docs/analytics/getting-started.md). (en proceso de traducción)

### Interactúa con tu(s) base(s) de datos

Firebase ofrece 2 soluciones de base de datos, accesibles al cliente basadas en la nube para sincronización de datos en tiempo real. [Conoce las diferencias entre ellas en la documentación de Firebase](https://firebase.google.com/docs/firestore/rtdb-vs-firestore).

#### Cloud Firestore

> `AngularFirestore` te permite trabajar con Cloud Firestore, la nueva base de datos insignia para el desarrollo de aplicaciones móviles. Mejorada sobre el éxito de la Realtime Database, con un nuevo y más intuitivo modelo de datos. Cloud Firestore también presenta consultas más rápidas y un mejor escalamiento en comparación a la Realtime Database. 

- [Documentos](docs/firestore/documents.md). (en proceso de traducción)
- [Colecciones](docs/firestore/collections.md). (en proceso de traducción)
- [Consultando Colecciones](docs/firestore/querying-collections.md). (en proceso de traducción)
- [Datos Offline](docs/firestore/offline-data.md). (en proceso de traducción)

#### Realtime Database

> `AngularFireDatabase` te permite trabajar con la Realtime Database, la base de datos original de Firebase. Es una solución eficiente y de baja latencia para aplicaciones movíles que requieren estado sicronizados entre clientes en tiempo real.

- [Objetos](docs/rtdb/objects.md). (en proceso de traducción)
- [Listas](docs/rtdb/lists.md). (en proceso de traducción)
- [Consultando Listas](docs/rtdb/querying-lists.md). (en proceso de traducción)

### Auténtica usuarios

- [Comenzando con Firebase Authentication](docs/auth/getting-started.md). (en proceso de traducción)
- [Enruta usuarios con AngularFire guards](docs/auth/router-guards.md). (en proceso de traducción)

### Carga archivos

- [Comenzando con Cloud Storage](docs/storage/storage.md). (en proceso de traducción)

### Recibe notificaciones push

- [Comenzando con Firebase Messaging](docs/messaging/messaging.md). (en proceso de traducción)

### **BETA:** Cambia el comportamiento y la apariencia de tu aplicacion sin desplegar nuevamente

> Firebase Remote Config es un servicio en la nube que te permite cambiar el comportamiento y la apariencia de tu aplicación sin necesidad de que los usuarios descarguen una actualización de tu app. [Conoce más sobre Remote Config](https://firebase.google.com/docs/remote-config).

- [Comenzando con Remote Config](docs/remote-config/getting-started.md). (en proceso de traducción)

### **NEW:** Monitorea el rendimiento de tu aplicación en producción

> Firebase Performance Monitoring es un servicio que te ayuda a comprender mejor las características de rendimiento de tus aplicaciones iOS, Android y web. [Conoce más sobre Performance Monitoring](https://firebase.google.com/docs/perf-mon).

- [Comenzando con Performance Monitoring](docs/performance/getting-started.md). (en proceso de traducción)

### Invoca directamente Cloud Functions

- [Comenzando con Callable Functions](docs/functions/functions.md). (en proceso de traducción)

### Despliega tu aplicación

> Firebase Hosting es un hospedaje de contenido web con grado de producción para desarrolladores. Con Hosting, podrás desplegar rápida y fácilmente aplicaciones web y contenido estático en una red global de distribución de contenido (CDN) con un solo comando.

- [Despliega tu aplicación en Firebase Hosting](docs/deploy/getting-started.md). (en proceso de traducción)

#### Server-side rendering

> Angular Universal es una tecnología que te permite ejecutar tu aplicación Angular en un servidor. Esto genera HTML en un proceso llamado renderizado del lado del servidor (SSR). Angularfire es compatible con renderizado del lado del servidor; permitiendole tomar ventanjas de la Optimización para Motores de Búsqueda (SEO), pre-visualización de enlaces, ganancia en rendimiento y más. [Conoce más sobre Angular Universal](https://angular.io/guide/universal).

- [Comenzando con Angular Universal](docs/universal/getting-started.md). (en proceso de traducción)
- [Desplegando tu aplicación Universal en Cloud Functions para Firebase](docs/universal/cloud-functions.md). (en proceso de traducción)
- [Prerenderiza aplicación Universal](docs/universal/prerendering.md). (en proceso de traducción)

### Ionic

- [Instalación y Configuración con Ionic CLI](docs/ionic/cli.md). (en proceso de traducción)
- [Utilizando AngularFire con Ionic 2](docs/ionic/v2.md). (en proceso de traducción)
- [Utilizando AngularFire con Ionic 3](docs/ionic/v3.md). (en proceso de traducción)
