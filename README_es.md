# AngularFire
La librería oficial de [Angular](https://angular.io/) para [Firebase](https://firebase.google.com/).

<strong><pre>ng add @angular/fire</pre></strong>

AngularFire suaviza las asperezas que un desarrollador Angular podría encontrar al implementar el [SDK de Firebase JS] independiente del framework (https://github.com/firebase/firebase-js-sdk) y tiene como objetivo proporcionar una experiencia de desarrollo más natural al ajustarse a las convenciones de Angular.

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


## Ejemplo de uso:

```ts
import { provideFirebaseApp, getApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

@NgModule({
  imports: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideFirestore(() => getFirestore()),
  ],
  ...
})
export class AppModule { }
```

```ts
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Item {
  name: string,
  ...
};

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of item$ | async">
      {{ item.name }}
    </li>
  </ul>
  `
})
export class AppComponent {
  item$: Observable<Item[]>;
  constructor(firestore: Firestore) {
    const collection = collection(firestore, 'items');
    this.item$ = collectionData(collection);
  }
}
```

## Compatibilidad

### Versiones de Angular y Firebase

AngularFire no sigue el control de versiones de Angular, ya que Firebase también tiene cambios importantes a lo largo del año. En su lugar, tratamos de mantener la compatibilidad con las especialidades de Firebase y Angular durante el mayor tiempo posible, rompiendo solo cuando necesitamos admitir una nueva especialidad de una u otra.

| Angular | Firebase | AngularFire  |
| --------|----------|--------------|
| 14      | 9        | ^7.4         |
| 13      | 9        | ^7.2         |
| 12      | 9        | ^7.0         |
| 12      | 7,8      | ^6.1.5       |
| 11      | 7,8      | ^6.1         |
| 10      | 8        | ^6.0.4       |
| 10      | 7        | ^6.0.3       |
| 9       | 8        | ^6.0.4       |
| 9       | 7        | ^6.0         |

<sub>Las combinaciones de versiones no documentadas aquí __pueden__ funcionar, pero no se han probado y verá advertencias de pares de NPM.</sub>

### Polyfills

Ni AngularFire ni Firebase contienen polyfills. Para tener compatibilidad en una amplia gama de entornos, sugerimos que se agreguen los siguientes polyfills a su aplicación:

| API                         | Entornos | Polyfill Sugerido  | Licencia   |
|-----------------------------|--------------------|--------------------|------------|
| Varias funcionalidades ES5+ | Safari &lt; 10     | [`core-js/stable`](https://github.com/zloirock/core-js#readme) | MIT        |
| `globalThis`                | [Chrome &lt; 71<br>Safari &lt; 12.1<br>iOS &lt; 12.2<br>Node &lt; 12](https://caniuse.com/mdn-javascript_builtins_globalthis) | [`globalThis`](https://github.com/es-shims/globalThis#readme) | MIT        |
| `Proxy`                     | [Safari &lt; 10](https://caniuse.com/proxy) | [`proxy-polyfill`](https://github.com/GoogleChrome/proxy-polyfill#readme) | Apache 2.0 |
| `fetch`                     | [Safari &lt; 10.1<br>iOS &lt; 10.3](https://caniuse.com/fetch) | [`cross-fetch`](https://github.com/lquixada/cross-fetch#readme) | MIT        |

## Recursos

[Inicio Rápido](docs/install-and-setup_es.md) - Ten tu primera aplicación levantada y corriendo siguiendo nuestra guía de inicio rápido. (en proceso de traducción).

[Contribuyendo](CONTRIBUTING.md).

[Plantilla Stackblitz](https://stackblitz.com/edit/angular-fire-start) - Recuerda colocar tu configuración de Firebase en `app/app.module.ts`.

[¿Actualizando a v7.0? Mira nuestra guía.](docs/version-7-upgrade.md). (en proceso de traducción)

### Aplicaciones de muestra

Tenemos tres aplicacionesd de nuestra en este repositorio:

1. [`samples/compat`](samples/compat) una aplicación de fregadero de cocina que demuestra el uso de la API de "compatibilidad"
1. [`samples/modular`](samples/modular)una aplicación de fregadero de cocina que demuestra la nueva API tree-shakable.
1. [`samples/advanced`](samples/advanced) la misma app que `samples/modular` pero demuestra conceptos más avanzados como la transferencia de estado (state-transfer) con angular universal , la importación dinámica de módulos de funciones de Firebase y la agrupación de datos de Firestore.

### Tienes Problemas?

Obten ayuda en nuestro [Q&A board](https://github.com/angular/angularfire/discussions?discussions_q=category%3AQ%26A), la [Lista de Correos Oficial](https://groups.google.com/forum/#!forum/firebase-talk) de Firebase, la [Comunidad Firebase en Slack](https://firebase.community/) (`#angularfire2`), el [Discord de la Comunidad Angular ](http://discord.gg/angular) (`#firebase`), [Gitter](https://gitter.im/angular/angularfire2), el [subreddit de Firebase](https://www.reddit.com/r/firebase), o en [Stack Overflow](https://stackoverflow.com/questions/tagged/angularfire2).

> **NOTA:** AngularFire es mantenida por Googlers pero no es un producto soportado por el equipo de Firebase. Las preguntas en la lista de correos y los issues que se muestra aqui son  respondidos a <strong>base del mejor esfuerzo</strong> de quienes lo mantienen y otros miembros de la comunidad. Si puede reproducir un problema con Firebase <em>fuera de la implementación de AngularFire</em>, por favor [crea un issue en el SDK Firebase para JS ](https://github.com/firebase/firebase-js-sdk/issues) o comuníquese de manera personalizada con el [Canaal de soporte de Firebase](https://firebase.google.com/support/).

## Guía de Desarrolladores

AngularFire tiene una nueva API tree-shakable, sin embargo, todavía está en desarrollo activo y la documentación está en proceso, por lo que sugerimos que la mayoría de los desarrolladores se queden con la API de compatibilidad por el momento. [Consulte la guía de actualización v7 para obtener más información.](docs/version-7-upgrade.md).

Esta guía para desarrolladores asume que estás usando la API de compatibilidad (`@angular/fire/compat/*`).


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

### Emuladores Locales

- [Comenzando con el conjunto de Emuladores de Firebase](docs/emulators/emulators.md)

### Carga archivos

- [Comenzando con Cloud Storage](docs/storage/storage.md). (en proceso de traducción)

### Recibe notificaciones push

- [Comenzando con Firebase Messaging](docs/messaging/messaging.md). (en proceso de traducción)

### **BETA:** Cambia el comportamiento y la apariencia de tu aplicacion sin desplegar nuevamente

> Firebase Remote Config es un servicio en la nube que te permite cambiar el comportamiento y la apariencia de tu aplicación sin necesidad de que los usuarios descarguen una actualización de tu app. [Conoce más sobre Remote Config](https://firebase.google.com/docs/remote-config).

- [Comenzando con Remote Config](docs/remote-config/getting-started.md). (en proceso de traducción)

### Monitorea el rendimiento de tu aplicación en producción

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
