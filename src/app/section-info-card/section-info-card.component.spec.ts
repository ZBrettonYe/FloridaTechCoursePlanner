import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionInfoCardComponent } from './section-info-card.component';

describe('SectionInfoCardComponent', () => {
  let component: SectionInfoCardComponent;
  let fixture: ComponentFixture<SectionInfoCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SectionInfoCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
