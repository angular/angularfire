import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { Auth, provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { COMMON_CONFIG } from '../test-config';
import { AuthGuard, AuthGuardModule } from '@angular/fire/auth-guard';
import { Router, RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { rando } from '../utils';

class TestComponent { }

describe('AuthGuard', () => {
  let app: FirebaseApp;
  let auth: Auth;
  let authGuard: AuthGuard;
  let router: Router;
  let appName: string;

  beforeEach(() => {
    appName = rando();
    TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
        provideAuth(() => {
          const auth = getAuth(getApp(appName));
          connectAuthEmulator(auth, 'http://localhost:9099');
          return auth;
        }),
        AuthGuardModule,
        RouterModule.forRoot([
          { path: 'a', component: TestComponent, canActivate: [AuthGuard] }
        ])
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: 'http://localhost:4200/' }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    auth = TestBed.inject(Auth);
    authGuard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    try { deleteApp(app).catch(() => undefined); } catch (e) { }
  });

  it('should be injectable', () => {
    expect(AuthGuard).toBeTruthy();
  });

  it('router should be valid', () => {
    expect(router).toBeTruthy();
  });

});
