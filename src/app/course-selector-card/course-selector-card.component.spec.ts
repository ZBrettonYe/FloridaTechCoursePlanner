import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseSelectorCardComponent } from './course-selector-card.component';

describe('CourseSelectorCardComponent', () => {
  let component: CourseSelectorCardComponent;
  let fixture: ComponentFixture<CourseSelectorCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CourseSelectorCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseSelectorCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
