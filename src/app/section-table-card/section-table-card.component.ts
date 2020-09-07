import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, OnDestroy, } from '@angular/core';
import { CourseDataService, Section, Building } from '../course-data.service';
import { MessageBusService } from '../message-bus.service';
import { sprintf } from 'sprintf-js';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-section-table-card',
  templateUrl: './section-table-card.component.html',
  styleUrls: ['./section-table-card.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SectionTableCardComponent implements OnInit, OnDestroy {
  private readonly TOPICS = MessageBusService.TOPICS.SectionTableCardComponent;
  private readonly SUBSCRIPTIONS: (Subscription | undefined)[] = [];

  @ViewChild(MatSort) matSort: MatSort;
  @ViewChild(MatPaginator) matPaginator: MatPaginator;
  @ViewChild(MatTable, {read: ElementRef}) matTableElement: ElementRef;

  readonly sections: SectionTableRow[] = [];
  readonly displayedColumns = [
    'crn',
    'subject',
    'course',
    'title',
    'instructor',
    'section',
    'days',
    'times',
    'places',
    'enroll',
    'creditHours'
  ];

  // For some reason, assigning a new value to dataSource makes it much faster
  // readonly dataSource = new MatTableDataSource<SectionTableRow>(this.sections);
  // dataSource = new MatTableDataSource<SectionTableRow>([] as SectionTableRow[]);
  dataSource: MatTableDataSource<SectionTableRow>;

  private mouseoverIndex = 0;

  readonly timestamps = {
    current: 0,
    update: 0
  };

  constructor(
    private readonly messageBus: MessageBusService,
    private readonly courseData: CourseDataService
  ) {
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SectionFilterCardComponent.newFilterFn,
      this.newFilterFnReady.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.CourseDataService.reload.complete,
      this.courseDataReady.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.CourseDataService.data.updateAvailable,
      this.courseDataUpdateAvailable.bind(this)
    ));
  }

  ngOnInit(): void { }

  ngOnDestroy() {
    for (const subscription of this.SUBSCRIPTIONS) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }

  private courseDataUpdateAvailable() {
    this.timestamps.update = this.courseData.timestamp;
  }

  /**
   * Prepare sections and data source when section data is ready.
   */
  private courseDataReady() {
    this.timestamps.current = this.courseData.timestamp;

    const sections = this.courseData.sections;
    this.sections.length = 0;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionRow = this.extractSectionData(section);
      sectionRow.index = i;
      this.sections.push(sectionRow);
    }

    this.dataSource = new MatTableDataSource<SectionTableRow>(this.sections);
    this.dataSource.sort = this.matSort;
    this.dataSource.paginator = this.matPaginator;
    this.dataSource.filterPredicate = () => true;
    this.dataSource.sortingDataAccessor = this.sortingDataAccessor.bind(this);
    this.dataSource.sort.active = 'crn';
    this.dataSource.sort.direction = 'asc';
    this.dataSource.sort.sortChange.emit();
  }

  /**
   * Extract and format section data.
   * @param section - Original section from CourseDataService.
   * @returns Processed object.
   */
  private extractSectionData(section: Section): SectionTableRow {
    // Extract fields that don't need processing
    const row = {
      semester: section.semester,
      campus: section.campus,
      crn: section.crn,
      subject: section.course.subject.code,
      courseNumber: section.course.course,
      title: section.title,
      instructor: section.instructor?.name ?? '',
      section: section.section,
      creditHours: section.creditHours,
      tags: section.course.tags.map(tag => `${tag.code.toLowerCase()} - ${tag.name.toLowerCase()}`),
      session: section.session === null ? '' : section.session
    } as SectionTableRow;

    // Extract schedules
    const schedules: SectionTableRowSchedule[] = [];
    for (const schedule of section.schedules) {
      const s = {
        days: schedule.days,
        room: schedule.room,
        // Mark course times that are not desirable
        startTimeColor: schedule.startTime <= 800 || 1700 <= schedule.startTime ? 'darkred' : undefined,
        endTimeColor: schedule.endTime <= 800 || 1700 <= schedule.endTime ? 'darkred' : undefined,
      } as SectionTableRowSchedule;

      // Format times into strings so we don't have to deal with formatting later
      let hour = Math.floor(schedule.startTime / 100);
      let minute = schedule.startTime % 100;
      s.startTime = sprintf('%02d:%02d', hour, minute);
      s.startTimeMinutes = hour * 60 + minute;

      hour = Math.floor(schedule.endTime / 100);
      minute = schedule.endTime % 100;
      s.endTime = sprintf('%02d:%02d', hour, minute);
      s.endTimeMinutes = hour * 60 + minute;

      const building = schedule.building;
      if (building instanceof Building) {
        s.building = building.code;
      } else if (typeof (building) === 'string') {
        s.building = building;
      } else {
        s.building = '';
      }

      schedules.push(s);
    }
    row.schedules = schedules;

    // Extract cap
    // Also put a color gradient from green to red depending on section fullness
    const cap = section.cap;
    let percentEnroll = cap[0] / cap[1];
    if (percentEnroll > 1) {
      percentEnroll = 1;
    }
    const hslHue = 128 * (1 - percentEnroll);
    const hslColor = `hsl(${hslHue}, 50%, 50%)`;
    row.enroll = {
      cap,
      hslColor
    };

    return row;
  }

  /**
   * Extract section data for sorting based on property.
   * @param row - The source row to be extracted.
   * @param property - Which property of the row should extract.
   * @returns Data of this section that can be used for sorting. The data may not be unique.
   */
  private sortingDataAccessor(row: SectionTableRow, property: string): string | number {
    switch (property) {
    case 'crn':
      return row.crn;
    case 'subject':
      return row.subject;
    case 'course':
      return row.courseNumber;
    case 'title':
      return row.title;
    case 'instructor':
      return row.instructor;
    case 'times':
      return Math.min(Infinity, ...row.schedules.map(schedule => schedule.startTimeMinutes));
    case 'enroll':
      return row.enroll.cap[1] === 0 ? Infinity : row.enroll.cap[0] / row.enroll.cap[1];
    case 'creditHours':
      return row.creditHours[0] * 100 + row.creditHours[1];
    default:
      console.warn(`Unknown sorting property "${property}"`);
      return 0;
    }
  }

  scrollToTableTop() {
    (this.matTableElement.nativeElement as HTMLElement).scrollIntoView();
  }

  private newFilterFnReady(filterFn: (row: SectionTableRow) => boolean) {
    this.dataSource.filterPredicate = filterFn;
    this.dataSource.filter = Math.random().toString();
  }

  cellClick(property: string, value: string | number) {
    this.messageBus.probe(this.TOPICS.click);
    this.messageBus.cast(
      this.TOPICS.click,
      {
        property,
        value
      } as SectionTableFilterValue
    );
  }

  mouseover(index: number) {
    if (index === this.mouseoverIndex) {
      return;
    }

    this.mouseoverIndex = index;
    this.messageBus.cast(this.TOPICS.mouseover, index);
  }

  updateButtonClick() {
    this.courseData.reload();
  }
}

export interface SectionTableRow {
  index: number;
  semester: string;
  campus: string;
  crn: number;
  subject: string;
  courseNumber: number;
  title: string;
  instructor: string;
  section: string;
  schedules: SectionTableRowSchedule[];
  enroll: {
    cap: [number, number];
    hslColor: string;
  };
  creditHours: [number, number];
  tags: string[];
  session: string;
}

export interface SectionTableRowSchedule {
  days: string;
  startTime: string;
  endTime: string;
  building: string;
  room: string;

  startTimeColor: string;
  endTimeColor: string;

  startTimeMinutes: number;
  endTimeMinutes: number;
}

export interface SectionTableFilterValue {
  property: string;
  value: string | number;
}
