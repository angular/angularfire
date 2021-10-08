import { NgModule } from '@angular/core';
import { AuthGuard } from './auth-guard';
import { registerVersion } from 'firebase/app';
import { VERSION } from '@angular/fire';

@NgModule({
  providers: [ AuthGuard ]
})
export class AuthGuardModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'auth-guard');
  }
}
