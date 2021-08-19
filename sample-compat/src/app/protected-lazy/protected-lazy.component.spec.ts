import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtectedLazyComponent } from './protected-lazy.component';

describe('ProtectedLazyComponent', () => {
  let component: ProtectedLazyComponent;
  let fixture: ComponentFixture<ProtectedLazyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProtectedLazyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProtectedLazyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
