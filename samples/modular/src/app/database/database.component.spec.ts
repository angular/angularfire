import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseComponent } from './database.component';

describe('DatabaseComponent', () => {
  let component: DatabaseComponent;
  let fixture: ComponentFixture<DatabaseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
