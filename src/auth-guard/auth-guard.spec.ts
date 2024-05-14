import { APP_BASE_HREF } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { AuthGuard, AuthGuardModule } from '@angular/fire/auth-guard';
import { Router, RouterModule } from '@angular/router';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

class TestComponent { }

describe('AuthGuard', () => {
  let router: Router;
  let appName: string;

  beforeEach(() => {
    appName = rando();
    TestBed.configureTestingModule({
      imports: [
        AuthGuardModule,
        RouterModule.forRoot([
          { path: 'a', component: TestComponent, canActivate: [AuthGuard] }
        ])
      ],
      providers: [
        provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
        provideAuth(() => {
          const auth = getAuth(getApp(appName));
          connectAuthEmulator(auth, 'http://localhost:9098');
          return auth;
        }),
        { provide: APP_BASE_HREF, useValue: 'http://localhost:4200/' }
      ]
    });

    router = TestBed.inject(Router);
  });

  it('should be injectable', () => {
    expect(AuthGuard).toBeTruthy();
  });

  it('router should be valid', () => {
    expect(router).toBeTruthy();
  });

});
