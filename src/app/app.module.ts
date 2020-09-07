import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CourseSelectorCardComponent, FullSectionDialogComponent, ConflictSectionDialogComponent } from './course-selector-card/course-selector-card.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FrontPageComponent } from './front-page/front-page.component';
import { HttpClientModule } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgModule } from '@angular/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { PrerequisiteHighlightPipe } from './prerequisite-highlight.pipe';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SectionExplorerComponent } from './section-explorer/section-explorer.component';
import { SectionFilterCardComponent } from './section-filter-card/section-filter-card.component';
import { SectionFilterOptionComponent } from './section-filter-option/section-filter-option.component';
import { SectionInfoCardComponent } from './section-info-card/section-info-card.component';
import { SectionTableCardComponent } from './section-table-card/section-table-card.component';
import { SemesterPlannerComponent } from './semester-planner/semester-planner.component';
import { PickSemesterDialogComponent } from './semester-planner/semester-planner.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarCardComponent } from './calendar-card/calendar-card.component';
import { MatMenuModule } from '@angular/material/menu';


@NgModule({
  declarations: [
    AppComponent,
    CourseSelectorCardComponent,
    FrontPageComponent,
    PrerequisiteHighlightPipe,
    SectionExplorerComponent,
    SectionFilterCardComponent,
    SectionFilterOptionComponent,
    SectionInfoCardComponent,
    SectionTableCardComponent,
    SemesterPlannerComponent,
    PickSemesterDialogComponent,
    FullSectionDialogComponent,
    ConflictSectionDialogComponent,
    CalendarCardComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    DragDropModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    NgxFilesizeModule,
    ReactiveFormsModule,
    ScrollingModule,
    CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory }),
    MatMenuModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
