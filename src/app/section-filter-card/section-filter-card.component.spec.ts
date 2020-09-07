import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionFilterCardComponent } from './section-filter-card.component';

describe('SectionFilterCardComponent', () => {
  let component: SectionFilterCardComponent;
  let fixture: ComponentFixture<SectionFilterCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SectionFilterCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionFilterCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
