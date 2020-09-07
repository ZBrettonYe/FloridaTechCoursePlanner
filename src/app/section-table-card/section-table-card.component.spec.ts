import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionTableCardComponent } from './section-table-card.component';

describe('SectionTableCardComponent', () => {
  let component: SectionTableCardComponent;
  let fixture: ComponentFixture<SectionTableCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SectionTableCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionTableCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
