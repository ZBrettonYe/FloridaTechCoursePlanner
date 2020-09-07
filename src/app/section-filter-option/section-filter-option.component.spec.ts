import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionFilterOptionComponent } from './section-filter-option.component';

describe('SectionFilterOptionComponent', () => {
  let component: SectionFilterOptionComponent;
  let fixture: ComponentFixture<SectionFilterOptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SectionFilterOptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionFilterOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
