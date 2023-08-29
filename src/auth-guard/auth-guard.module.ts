import { NgModule } from '@angular/core';
import { VERSION } from '@angular/fire';
import { registerVersion } from 'firebase/app';
import { AuthGuard } from './auth-guard';

@NgModule({
  providers: [ AuthGuard ]
})
export class AuthGuardModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'auth-guard');
  }
}
