import { TestBed } from '@angular/core/testing';

import { SemesterPlannerService } from './semester-planner.service';

describe('SemesterPlannerService', () => {
  let service: SemesterPlannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SemesterPlannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
