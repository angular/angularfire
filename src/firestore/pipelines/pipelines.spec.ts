import { TestBed } from '@angular/core/testing';
import { constant as liteConstant, field as liteField } from '@angular/fire/firestore/lite/pipelines';
import { constant as firestoreConstant, field as firestoreField } from '@angular/fire/firestore/pipelines';

describe('Firestore pipelines', () => {
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
