import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirestoreOfflineComponent } from './firestore-offline.component';

describe('FirestoreComponent', () => {
  let component: FirestoreOfflineComponent;
  let fixture: ComponentFixture<FirestoreOfflineComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FirestoreOfflineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirestoreOfflineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
