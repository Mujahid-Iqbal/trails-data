import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrailDetailComponent } from './trail-detail.component';

describe('TrailDetailComponent', () => {
  let component: TrailDetailComponent;
  let fixture: ComponentFixture<TrailDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TrailDetailComponent]
    });
    fixture = TestBed.createComponent(TrailDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
