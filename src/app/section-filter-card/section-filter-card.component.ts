import { Component, OnInit, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { SectionFilterOptionConfig, SectionFilterOptionComponent } from '../section-filter-option/section-filter-option.component';
import { MessageBusService } from '../message-bus.service';
import { CourseDataService } from '../course-data.service';
import { SectionTableRow } from '../section-table-card/section-table-card.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-section-filter-card',
  templateUrl: './section-filter-card.component.html',
  styleUrls: ['./section-filter-card.component.css']
})
export class SectionFilterCardComponent implements OnInit, OnDestroy {
  private readonly TOPICS = MessageBusService.TOPICS.SectionFilterCardComponent;
  private readonly SUBSCRIPTIONS: (Subscription | undefined)[] = [];

  private readonly campusFilter: SectionFilterOptionConfig = {
    property: '???',
    label: 'Campus',
    options: [],
    checked: true,
    inputValue: 'Main Campus'
  };
  private readonly sessionFilter: SectionFilterOptionConfig = {
    property: '???',
    label: 'Session',
    options: [],
    checked: false,
    inputValue: ''
  };
  private readonly subjectFilter: SectionFilterOptionConfig = {
    property: 'subject',
    label: 'Subject',
    options: [],
    checked: false,
    inputValue: ''
  };
  private readonly courseNumberFilter: SectionFilterOptionConfig = {
    property: 'courseNumber',
    label: 'Course Number',
    options: [],
    checked: false,
    inputValue: ''
  };
  private readonly titleFilter: SectionFilterOptionConfig = {
    property: 'title',
    label: 'Title',
    options: [],
    checked: false,
    inputValue: ''
  };
  private readonly instructorFilter: SectionFilterOptionConfig = {
    property: 'instructor',
    label: 'Instructor',
    options: [],
    checked: false,
    inputValue: ''
  };
  private readonly tagsFilter: SectionFilterOptionConfig = {
    property: '???',
    label: 'Tags',
    options: [],
    checked: false,
    inputValue: ''
  };
  private readonly creditHoursFilter: SectionFilterOptionConfig = {
    property: 'creditHours',
    label: 'Credit Hours',
    options: [],
    checked: false,
    inputValue: ''
  };

  semester = 'fall';

  readonly semesterYears = [2020, 2020, 2020];

  readonly filterConfigs = [
    [this.campusFilter, this.sessionFilter],
    [this.subjectFilter, this.courseNumberFilter],
    [this.titleFilter, this.instructorFilter],
    [this.tagsFilter, this.creditHoursFilter]
  ];

  private castFilterFnTimeoutId: any;

  @ViewChildren(SectionFilterOptionComponent) filters: QueryList<SectionFilterOptionComponent>;

  /**
   * Subscribe to topics.
   */
  constructor(
    private messageBus: MessageBusService,
    private courseData: CourseDataService
  ) {
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.CourseDataService.reload.complete,
      this.courseDataReady.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SectionFilterOptionComponent.update,
      this.optionUpdate.bind(this)
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

  /**
   * Extract options for each filter based on sections.
   */
  courseDataReady() {
    for (let i = 0; i < 3; i++) {
      this.semesterYears[i] = this.courseData.semesterYears[i];
    }

    this.campusFilter.options = this.courseData.campuses;
    this.sessionFilter.options = this.courseData.sessions;
    this.subjectFilter.options = this.courseData.subjects.map(subject => subject.code);

    const courseNumbersSet = new Set(this.courseData.courses.map(course => course.course.toString()));
    this.courseNumberFilter.options = Array.from(courseNumbersSet.values());
    this.courseNumberFilter.options.sort();

    this.titleFilter.options = this.courseData.titles;

    const instructorSet = new Set(this.courseData.sections.map(section => section.instructor?.name));
    const instructorList = Array.from(instructorSet.values()).filter(name => name !== undefined) as string[];
    instructorList.sort();
    this.instructorFilter.options = instructorList;

    this.tagsFilter.options = this.courseData.tags.map(tag => `${tag.code} - ${tag.name}`);

    let creditHoursList = this.courseData.sections
      .map(section => section.creditHours)
      .reduce((list, current) => list.concat(current), [] as number[]);
    const creditHoursSet = new Set(creditHoursList);
    creditHoursList = Array.from(creditHoursSet.values());
    creditHoursList.sort((a, b) => a - b);
    this.creditHoursFilter.options = creditHoursList.map(creditHour => creditHour.toString());

    this.optionUpdate();
  }

  /**
   * Called whenever the option changes.
   * It setup a cool down before the actual filter function is casted.
   * This prevents rapidly casting many filter functions when filters are modified at the same time.
   */
  optionUpdate() {
    // Cancel last cool down. No effect if last cool down has already executed
    clearTimeout(this.castFilterFnTimeoutId);
    // Setup new cool down.
    this.castFilterFnTimeoutId = setTimeout(this.castFilterFn.bind(this), 200);
  }

  /**
   * Make and cast new filter function.
   */
  castFilterFn() {
    const semester = this.semester;

    const campus = this.campusFilter.checked ? this.campusFilter.inputValue.toLowerCase() : '';
    const session = this.sessionFilter.checked ? this.sessionFilter.inputValue.toLowerCase() : '';
    const subject = this.subjectFilter.checked ? this.subjectFilter.inputValue.toLowerCase() : '';

    const courseNumber =
      this.courseNumberFilter.checked && this.courseNumberFilter.inputValue !== ''
        ? +this.courseNumberFilter.inputValue
        : -1;

    const title = this.titleFilter.checked ? this.titleFilter.inputValue.toLowerCase() : '';
    const instructor = this.instructorFilter.checked ? this.instructorFilter.inputValue.toLowerCase() : '';
    const tag = this.tagsFilter.checked ? this.tagsFilter.inputValue.toLowerCase() : '';

    const creditHour =
      this.creditHoursFilter.checked && this.creditHoursFilter.inputValue !== ''
        ? +this.creditHoursFilter.inputValue
        : -1;

    const filterFn = (row: SectionTableRow) => {
      return row.semester.toLowerCase().includes(semester)
        && row.campus.toLowerCase().includes(campus)
        && row.session.toLowerCase().includes(session)
        && row.subject.toLowerCase().includes(subject)
        && (courseNumber === -1 ? true : row.courseNumber === courseNumber)
        && row.title.toLowerCase().includes(title)
        && row.instructor.toLowerCase().includes(instructor)
        && (tag === '' || row.tags.reduce((isTrue, _tag) => isTrue || _tag.includes(tag), false))
        && (creditHour === -1 ? true : row.creditHours[0] <= creditHour && creditHour <= row.creditHours[1]);
    };

    this.messageBus.cast(this.TOPICS.newFilterFn, filterFn);
  }

  /**
   * Cast message to filters to reset themselves.
   */
  resetFilters() {
    this.messageBus.cast(this.TOPICS.resetFilters);
  }
}
