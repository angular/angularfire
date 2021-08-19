import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryComponent } from './secondary.component';

describe('SecondaryComponent', () => {
  let component: SecondaryComponent;
  let fixture: ComponentFixture<SecondaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecondaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
