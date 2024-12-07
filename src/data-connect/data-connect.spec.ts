/*
import { TestBed } from '@angular/core/testing';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { DataConnect, getDataConnect, provideDataConnect } from '@angular/fire/data-connect';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';


describe('DataConnect', () => {
  let dataConnect: DataConnect;
  let providedDataConnect: DataConnect;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideDataConnect(() => {
                  providedDataConnect = getDataConnect(getApp(appName));
                  return providedDataConnect;
                }),
            ],
        });
        dataConnect = TestBed.inject(DataConnect);
    });

    it('should be injectable', () => {
      expect(providedDataConnect).toBeTruthy();
      expect(dataConnect).toEqual(providedDataConnect);
    });

  });

});
*/