import { TestBed } from '@angular/core/testing';
import { AI, getAI, provideAI } from '@angular/fire/ai';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('AI', () => {
  let app: FirebaseApp;
  let ai: AI;
  let providedAI: AI;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideAI(() => {
                    providedAI = getAI(getApp(appName));
                    return providedAI;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        ai = TestBed.inject(AI);
    });

    it('should be injectable', () => {
        expect(providedAI).toBeTruthy();
        expect(ai).toEqual(providedAI);
        expect(ai.app).toEqual(app);
    });

  });

});
