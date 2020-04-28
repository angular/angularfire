import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { COMMON_CONFIG } from '../test-config';
import { AngularFireAuthGuardModule, AngularFireAuthGuard } from './public_api';
import { RouterModule, Router } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { rando } from '../firestore/utils.spec';

describe('AngularFireAuthGuard', () => {
    let app: FirebaseApp;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
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
        app.delete().then(done, done);
    });

    it('should be injectable', () => {
        expect(router).toBeTruthy();
    });
});
