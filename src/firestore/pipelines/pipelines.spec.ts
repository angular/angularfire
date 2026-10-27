import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Firestore as FirestoreLite } from '@angular/fire/firestore/lite';
import { constant as liteConstant, field as liteField } from '@angular/fire/firestore/lite/pipelines';
import { constant as firestoreConstant, field as firestoreField } from '@angular/fire/firestore/pipelines';

describe('Firestore pipelines', () => {
  it('creates a pipeline from injected Firestore', () => {
    const pipeline = jasmine.createSpy('pipeline').and.returnValue({});
    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: { pipeline } }],
    });

    TestBed.runInInjectionContext(() => {
      expect(inject(Firestore).pipeline()).toBeTruthy();
    });
    expect(pipeline).toHaveBeenCalled();
  });

  it('creates a pipeline from injected Firestore Lite', () => {
    const pipeline = jasmine.createSpy('pipeline').and.returnValue({});
    TestBed.configureTestingModule({
      providers: [{ provide: FirestoreLite, useValue: { pipeline } }],
    });

    TestBed.runInInjectionContext(() => {
      expect(inject(FirestoreLite).pipeline()).toBeTruthy();
    });
    expect(pipeline).toHaveBeenCalled();
  });

  it('exposes pipeline expressions for Firestore', () => {
    TestBed.runInInjectionContext(() => {
      expect(firestoreField('name')).toBeTruthy();
      expect(firestoreConstant('value')).toBeTruthy();
    });
  });

  it('exposes pipeline expressions for Firestore Lite', () => {
    TestBed.runInInjectionContext(() => {
      expect(liteField('name')).toBeTruthy();
      expect(liteConstant('value')).toBeTruthy();
    });
  });
});
