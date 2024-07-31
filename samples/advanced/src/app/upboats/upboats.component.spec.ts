import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpboatsComponent } from './upboats.component';

describe('UpboatsComponent', () => {
  let component: UpboatsComponent;
  let fixture: ComponentFixture<UpboatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UpboatsComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpboatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
