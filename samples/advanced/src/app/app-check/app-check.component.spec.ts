import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppCheckComponent } from './app-check.component';

describe('RemoteConfigComponent', () => {
  let component: AppCheckComponent;
  let fixture: ComponentFixture<AppCheckComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
