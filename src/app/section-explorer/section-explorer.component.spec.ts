import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionExplorerComponent } from './section-explorer.component';

describe('SectionExplorerComponent', () => {
  let component: SectionExplorerComponent;
  let fixture: ComponentFixture<SectionExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SectionExplorerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
