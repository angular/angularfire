import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
import { COMMON_CONFIG } from '../../test-config';
import { AngularFireAuthGuard, AngularFireAuthGuardModule } from '@angular/fire/compat/auth-guard';
import { Router, RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { rando } from '../../utils';

class TestComponent { }

describe('AngularFireAuthGuard', () => {
  let app: FirebaseApp;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireAuthGuardModule,
        RouterModule.forRoot([
          { path: 'a', component: TestComponent, canActivate: [AngularFireAuthGuard] }
        ])
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: 'http://localhost:4200/' }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    app.delete().catch(() => undefined);
  });

  it('should be injectable', () => {
    expect(router).toBeTruthy();
  });
});
