import {
  EnvironmentProviders,
  InjectionToken,
  Injector,
  NgModule,
  NgZone,
  Optional,
  makeEnvironmentProviders,
} from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { AppCheckInstances } from '@angular/fire/app-check';
import { registerVersion } from 'firebase/app';
import { VertexAI as FirebaseVertexAI } from 'firebase/vertexai';
import { VERTEX_AI_PROVIDER_NAME, VertexAI, VertexAIInstances } from './vertexai';

export const PROVIDED_VERTEX_AI_INSTANCES = new InjectionToken<VertexAI[]>('angularfire2.vertexai-instances');

export function defaultVertexAIInstanceFactory(provided: FirebaseVertexAI[]|undefined, defaultApp: FirebaseApp) {
  const defaultVertexAI = ɵgetDefaultInstanceOf<FirebaseVertexAI>(VERTEX_AI_PROVIDER_NAME, provided, defaultApp);
  return defaultVertexAI && new VertexAI(defaultVertexAI);
}

export function vertexAIInstanceFactory(fn: (injector: Injector) => FirebaseVertexAI) {
  return (zone: NgZone, injector: Injector) => {
    const vertexAI = zone.runOutsideAngular(() => fn(injector));
    return new VertexAI(vertexAI);
  };
}

const VERTEX_AI_INSTANCES_PROVIDER = {
  provide: VertexAIInstances,
  deps: [
    [new Optional(), PROVIDED_VERTEX_AI_INSTANCES ],
  ]
};

const DEFAULT_VERTEX_AI_INSTANCE_PROVIDER = {
  provide: VertexAI,
  useFactory: defaultVertexAIInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_VERTEX_AI_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_VERTEX_AI_INSTANCE_PROVIDER,
    VERTEX_AI_INSTANCES_PROVIDER,
  ]
})
export class VertexAIModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'vertexai');
  }
}

export function provideVertexAI(fn: (injector: Injector) => FirebaseVertexAI, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'vertexai');

  return makeEnvironmentProviders([
    DEFAULT_VERTEX_AI_INSTANCE_PROVIDER,
    VERTEX_AI_INSTANCES_PROVIDER,
    {
      provide: PROVIDED_VERTEX_AI_INSTANCES,
      useFactory: vertexAIInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        [new Optional(), AppCheckInstances ],
        ...deps,
      ]
    }
  ]);
}
