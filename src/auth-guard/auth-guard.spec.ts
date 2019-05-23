import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { COMMON_CONFIG } from './test-config';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAuthGuardModule, AngularFireAuthGuard } from '@angular/fire/auth-guard';
import { RouterModule, Router } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

describe('AngularFireAuthGuard', () => {
    let app: FirebaseApp;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                AngularFireModule.initializeApp(COMMON_CONFIG),
                AngularFireAuthModule,
                AngularFireAuthGuardModule,
                RouterModule.forRoot([
                    { path: 'a', redirectTo: '/', canActivate: [AngularFireAuthGuard] }
                ])
            ],
            providers: [
                { provide: APP_BASE_HREF, useValue: 'http://localhost:4200/' }
            ]
        });
        inject([FirebaseApp, Router], (app_: FirebaseApp, router_: Router) => {
            app = app_;
            router = router_;
        })();
    });

    afterEach(done => {
        app.delete().then(done, done.fail);
    });
    
    it('should be injectable', () => {
        expect(router).toBeTruthy();
    });
});