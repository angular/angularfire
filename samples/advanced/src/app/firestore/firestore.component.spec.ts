import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirestoreComponent } from './firestore.component';

describe('FirestoreComponent', () => {
  let component: FirestoreComponent;
  let fixture: ComponentFixture<FirestoreComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [FirestoreComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
