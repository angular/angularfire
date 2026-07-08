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
import { AI as FirebaseAI } from 'firebase/ai';
import { registerVersion } from 'firebase/app';
import { AI, AIInstances, AI_PROVIDER_NAME } from './ai';

export const PROVIDED_AI_INSTANCES = new InjectionToken<AI[]>('angularfire2.ai-instances');

export function defaultAIInstanceFactory(provided: FirebaseAI[]|undefined, defaultApp: FirebaseApp) {
  const defaultAI = ɵgetDefaultInstanceOf<FirebaseAI>(AI_PROVIDER_NAME, provided, defaultApp);
  return defaultAI && new AI(defaultAI);
}

export function AIInstanceFactory(fn: (injector: Injector) => FirebaseAI) {
  return (zone: NgZone, injector: Injector) => {
    const ai = zone.runOutsideAngular(() => fn(injector));
    return new AI(ai);
  };
}

const AI_INSTANCES_PROVIDER = {
  provide: AIInstances,
  deps: [
    [new Optional(), PROVIDED_AI_INSTANCES ],
  ]
};

const DEFAULT_AI_INSTANCE_PROVIDER = {
  provide: AI,
  useFactory: defaultAIInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_AI_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_AI_INSTANCE_PROVIDER,
    AI_INSTANCES_PROVIDER,
  ]
})
export class AIModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'ai');
  }
}

export function provideAI(fn: (injector: Injector) => FirebaseAI, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'ai');

  return makeEnvironmentProviders([
    DEFAULT_AI_INSTANCE_PROVIDER,
    AI_INSTANCES_PROVIDER,
    {
      provide: PROVIDED_AI_INSTANCES,
      useFactory: AIInstanceFactory(fn),
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
