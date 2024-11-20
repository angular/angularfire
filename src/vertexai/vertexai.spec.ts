import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { VertexAI, getVertexAI, provideVertexAI } from '@angular/fire/vertexai';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('VertexAI', () => {
  let app: FirebaseApp;
  let vertexAI: VertexAI;
  let providedVertexAI: VertexAI;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideVertexAI(() => {
                    providedVertexAI = getVertexAI(getApp(appName));
                    return providedVertexAI;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        vertexAI = TestBed.inject(VertexAI);
    });

    it('should be injectable', () => {
        expect(providedVertexAI).toBeTruthy();
        expect(vertexAI).toEqual(providedVertexAI);
        expect(vertexAI.app).toEqual(app);
    });

  });

});
