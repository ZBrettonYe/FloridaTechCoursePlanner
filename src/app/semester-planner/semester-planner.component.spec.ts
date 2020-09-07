import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlannerComponent } from './semester-planner.component';

describe('SemesterPlannerComponent', () => {
  let component: SemesterPlannerComponent;
  let fixture: ComponentFixture<SemesterPlannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SemesterPlannerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SemesterPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
