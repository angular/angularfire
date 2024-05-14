import { APP_BASE_HREF } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthGuard, AngularFireAuthGuardModule } from '@angular/fire/compat/auth-guard';
import { Router, RouterModule } from '@angular/router';
import { COMMON_CONFIG } from '../../../src/test-config';
import { rando } from '../../../src/utils';

class TestComponent { }

describe('AngularFireAuthGuard', () => {
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

    router = TestBed.inject(Router);
  });

  it('should be injectable', () => {
    expect(router).toBeTruthy();
  });
});
