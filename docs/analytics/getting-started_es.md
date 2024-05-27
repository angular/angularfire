# Comenzando con Google Analytics

`AngularFireAnalytics` importa dinámicamente la biblioteca `firebase/analytics` y proporciona una versión basada en promesas [Firebase Analytics SDK (`firebase.analytics.Analytics`)](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html).

### API:

```ts
class AngularFireAnalytics {
  updateConfig(options: {[key:string]: any}): Promise<void>;

  // from firebase.analytics() proxy:
  logEvent(eventName: string, eventParams?: {[key: string]: any}, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setCurrentScreen(screenName: string, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setUserId(id: string, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setUserProperties(properties: analytics.CustomParams, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>;
  app: Promise<app.App>;
}

COLLECTION_ENABLED = InjectionToken<boolean>;
APP_VERSION = InjectionToken<string>;
APP_NAME = InjectionToken<string>;
DEBUG_MODE = InjectionToken<boolean>;
CONFIG = InjectionToken<Config>;
```

### Uso:

```ts
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ]
})
export class AppModule { }
```

`AngularFireAnalyticsModule` importará y configurará dinámicamente `firebase/analytics`. Se registrará automáticamente un evento `page_view` (consulte `CONFIG` a continuación si desea desactivar este comportamiento).

En su componente, puede inyectar dependencia `AngularFireAnalytics` y hacer llamadas contra el SDK:

```ts
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

constructor(analytics: AngularFireAnalytics) {
  analytics.logEvent('custom_event', { ... });
}
```

## Rastreando visualizaciones

Puede registrar [eventos `screen_view`](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html#parameters_10) por ti mismo, por supuesto, pero AngularFire proporciona el `ScreenTrackingService` que se integra automáticamente con Angular Router para proporcionar a Firebase un seguimiento de visualización de pantalla. Simplemente puede integrar así:

```ts
import { AngularFireAnalyticsModule, ScreenTrackingService } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ],
  providers: [
    ScreenTrackingService
  ]
})
export class AppModule { }
```

`AngularFireAnalyticsModule` inicializará `ScreenTrackingService` si se proporciona.

## Rastreando Identidificadores de Usuario

Para enriquecer sus datos de Analytics, puede realizar un seguimiento del usuario que ha iniciado sesión configurando [`setuserid`](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html#setuserid) y [` setUserProperties`](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html#set-user-properties). AngularFire proporciona un `UserTrackingService` que importará dinámicamente `firebase/auth`, monitoreará los cambios en el usuario que inició sesión y llamará a `setuserid` automáticamente.


```ts
import { AngularFireAnalyticsModule, UserTrackingService } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ],
  providers: [
    UserTrackingService
  ]
})
export class AppModule { }
```

`AngularFireAnalyticsModule` inicializará `UserTrackingService` si se proporciona.

## Configurando con Inyección de Dependencia

### Configura Google Analtyics con `CONFIG`

El uso del token DI `CONFIG` (*default: {}*) le permitirá configurar Google Analytics. Por ejemplo, puede omitir el envío del evento `page_view` inicial, anonimizar las direcciones IP y deshabilitar las señales de personalización de anuncios para todos los eventos de la siguiente manera:

```ts
import { AngularFireAnalyticsModule, CONFIG } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ],
  providers: [
    { provide: CONFIG, useValue: {
      send_page_view: false,
      allow_ad_personalization_signals: false,
      anonymize_ip: true
    } }
  ]
})
export class AppModule { }
```

Consulte la documentación de gtag.js para conocer las diferentes opciones de configuración a su disposición.

### Usar DebugView `DEBUG_MODE`

Para usar [DebugView en Analytics](https://console.firebase.google.com/project/_/analytics/debugview), establezca `DEBUG_MODE` en `true` (*default: false*).

### Restree despliegues con `APP_NAME` y `APP_VERSION`

Si proporciona `APP_NAME` y `APP_VERSION` (*default: undefined*), podrá [seguir la adopción de la versión](https://console.firebase.google.com/project/_/analytics/latestrelease) de su PWA.

### Deshabilitar la recopilación de análisis a través de `COLLECTION_ENABLED`

Si establece `COLLECTION_ENABLED` (*default: true*) en `false`, la recopilación de análisis se desactivará para esta aplicación en este dispositivo. Para volver a optar por la recopilación de análisis, puede llamar a `setAnalyticsCollectionEnabled(true)`.

Poner estas API en uso con cookies le permitiría crear un esquema de recopilación de análisis flexible que respetaría el deseo de privacidad de su usuario.
