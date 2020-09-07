import { Component, OnInit, ViewChild, ViewEncapsulation, Input, OnDestroy } from '@angular/core';
import { CourseDataService, Subject, Section, Course, SectionSchedule, Building, Employee } from '../course-data.service';
import { MessageBusService } from '../message-bus.service';
import { MatTabGroup } from '@angular/material/tabs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { SemesterPlannerService } from '../semester-planner.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-course-selector-card',
  templateUrl: './course-selector-card.component.html',
  styleUrls: ['./course-selector-card.component.css', '../prerequisite-highlight.css', '../bootstrap.badge.css'],
  encapsulation: ViewEncapsulation.None
})
export class CourseSelectorCardComponent implements OnInit, OnDestroy {
  private readonly TOPICS = MessageBusService.TOPICS.CourseSelectorCardComponent;
  private readonly SUBSCRIPTIONS: (Subscription | undefined)[] = [];

  subjectPrefixes: string[] = [];
  readonly COURSE_LEVELS = Array.from(Array(7).keys());

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  subjects: Subject[] = [];
  courses: Course[] = [];
  sections: Section[] = [];

  detailMode: 'course' | 'section' | null = null;
  detailTitle = '';
  detailDescription = 'Hover over a course or a section to see details.';
  detailCourse: Course;
  detailSection: Section;
  detailInstructor: Employee | null;

  courseInfoOrders = Array(5).fill(null).map((_value, index) => index);
  sectionInfoOrders = Array(8).fill(null).map((_value, index) => index);

  semester: 'spring' | 'summer' | 'fall' | null = null;
  private readonly campus = 'Main Campus';

  private selectedSections: Section[] = [];
  private readonly sectionStatusCache = new Map<Section, 'added' | 'full' | 'conflict' | undefined>();
  private readonly backgroundColor = {
    green: '#dff0d8',
    yellow: '#fcf8e3',
    red: '#f2dede'
  };

  private sectionMouseEnterTimeout = setTimeout(() => {}, 0);

  constructor(
    private readonly courseData: CourseDataService,
    private readonly messageBus: MessageBusService,
    private readonly semesterPlanner: SemesterPlannerService,
    private readonly dialog: MatDialog
  ) {
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.CourseDataService.reload.complete,
      this.courseDataAvailable.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SemesterPlannerComponent.semester,
      this.semesterAvailable.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SemesterPlannerService.sections.update,
      this.selectedSectionsUpdate.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      this.TOPICS.gotoCourse,
      this.gotoCourse.bind(this)
    ));
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    for (const subscription of this.SUBSCRIPTIONS) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }

  private semesterAvailable([semester, _year]: ['spring' | 'summer' | 'fall', number]) {
    this.semester = semester;
    console.log(this.semester);
  }

  private courseDataAvailable() {
    if (this.semester === null) {
      setTimeout(this.courseDataAvailable.bind(this), 500);
      return;
    }

    this.subjects = this.courseData.subjects
      // Only keep the courses of current semester.
      // The ?? 'fall' is unnecessary but needed to keep tslint happy
      .map(s => s.copy(this.campus, this.semester ?? 'fall'))
      // Only keep subjects that has at least 1 course
      .filter(s => s.courses.length);

    this.subjectPrefixes = [... new Set(this.subjects.map((subject) => subject.code[0]))];
  }

  subjectClick(s: Subject) {
    this.courses = s.courses;
    this.tabGroup.selectedIndex = 1;
  }

  courseClick(c: Course) {
    this.sections = c.sections;
    this.tabGroup.selectedIndex = 2;
  }

  private gotoCourse(s: Section) {
    this.subjectClick(s.course.subject);
    this.courseClick(s.course);
  }

  courseMouseEnter(c: Course) {
    this.detailMode = 'course';
    this.detailTitle = `${c.subject.code} ${c.course}`;
    this.detailDescription = c.title;
    this.detailCourse = c;
  }

  sectionMouseEnter(s: Section) {
    this.detailMode = 'section';
    this.detailTitle = `CRN ${s.crn}`;
    this.detailDescription = s.title;
    this.detailSection = s;
    this.detailInstructor = s.instructor;

    clearTimeout(this.sectionMouseEnterTimeout);
    this.sectionMouseEnterTimeout = setTimeout(
      (() => this.semesterPlanner.sectionMouseEnter(s)).bind(this),
      200
    );
  }

  sectionMouseLeave() {
    clearTimeout(this.sectionMouseEnterTimeout);
    this.semesterPlanner.sectionMouseLeave();
  }

  sectionClick(s: Section) {
    // Switch to another section of the same course
    if (this.selectedSections.some(section => section.course === s.course)) {
      this.semesterPlanner.sectionClick(s);
      return;
    }

    switch (this.sectionStatus(s)) {
      case 'full':
        this.dialog.open(FullSectionDialogComponent).afterClosed().subscribe(
          (result: boolean) => result && this.semesterPlanner.sectionClick(s)
        );
        return;
      case 'conflict':
        this.dialog.open(ConflictSectionDialogComponent).afterClosed().subscribe(
          (result: boolean) => result && this.semesterPlanner.sectionClick(s)
        );
        return;
      default:
        this.semesterPlanner.sectionClick(s);
    }
  }

  courseNumberLevel(c: Course) {
    return `${Math.floor(c.course / 1000)}000 Level`;
  }

  scheduleBuilding(s: SectionSchedule) {
    const building = s.building ?? '';

    if (building instanceof String) {
      return building;
    } else {
      return (building as Building).code;
    }
  }

  cdkDropListDropped(orders: number[], event: CdkDragDrop<string[]>) {
    const prev = event.previousIndex;
    const curr = event.currentIndex;

    if (prev < curr) {
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] === prev) {
          orders[i] = curr;
        } else if (prev < orders[i] && orders[i] <= curr) {
          orders[i]--;
        }
      }
    } else if (curr < prev) {
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] === prev) {
          orders[i] = curr;
        } else if (curr <= orders[i] && orders[i] < prev) {
          orders[i]++;
        }
      }
    }
  }

  selectedSectionsUpdate(sections: Section[]) {
    this.selectedSections = sections;
    this.sectionStatusCache.clear();
    console.log(this.selectedSections);
  }

  private sectionStatus(s: Section): 'added' | 'full' | 'conflict' | undefined {
    if (this.sectionStatusCache.has(s)) {
      return this.sectionStatusCache.get(s);
    }

    if (this.selectedSections.includes(s)) {
      this.sectionStatusCache.set(s, 'added');
      return 'added';
    }

    if (this.isSectionConflict(s)) {
      this.sectionStatusCache.set(s, 'conflict');
      return 'conflict';
    }

    if (s.cap[1] && s.cap[0] >= s.cap[1]) {
      this.sectionStatusCache.set(s, 'full');
      return 'full';
    }

    this.sectionStatusCache.set(s, undefined);
    return undefined;
  }

  private isSectionConflict(s: Section) {
    for (const section of this.selectedSections) {
      for (const dayChar of ['U', 'M', 'T', 'W', 'R', 'F', 'S']) {
        const times: [number, number][] = [];

        for (const schedule of s.schedules) {
          if (schedule.days?.includes(dayChar)) {
            times.push([schedule.startTime, schedule.endTime]);
          }
        }
        for (const schedule of section.schedules) {
          if (schedule.days?.includes(dayChar)) {
            times.push([schedule.startTime, schedule.endTime]);
          }
        }

        times.sort((t1, t2) => t1[0] - t2[0]);

        for (let i = 1; i < times.length; i++) {
          if (times[i - 1][1] >= times[i][0]) {
            return true;
          }
        }
      }
    }

    return false;
  }

  sectionBackgroundColor(s: Section) {
    const status = this.sectionStatus(s);

    switch (status) {
      case 'added':
        return this.backgroundColor.green;
      case 'full':
        return this.backgroundColor.yellow;
      case 'conflict':
        return this.backgroundColor.red;
      default:
        return undefined;
    }
  }

  private courseStatus(c: Course): 'added' | 'full' | 'conflict' | undefined {
    if (c.sections.some(s => this.selectedSections.includes(s))) {
      return 'added';
    }

    if (c.sections.every(s => s.cap[0] && s.cap[0] >= s.cap[1])) {
      return 'full';
    }

    if (c.sections.every(s => this.sectionStatus(s) === 'conflict')) {
      return 'conflict';
    }
  }

  courseBackgroundColor(c: Course) {
    const status = this.courseStatus(c);

    switch (status) {
      case 'added':
        return this.backgroundColor.green;
      case 'full':
        return this.backgroundColor.yellow;
      case 'conflict':
        return this.backgroundColor.red;
      default:
        return undefined;
    }
  }

  isCourseLevelExists(level: number) {
    return this.courses.some((course) => Math.floor(course.course / 1000) === level);
  }

  scrollIntoView(id: string) {
    document.getElementById(id)?.scrollIntoView();
  }
}

@Component({
  selector: 'app-full-section-dialog',
  templateUrl: 'full-section-dialog.html',
  styleUrls: ['full-section-dialog.css']
})
export class FullSectionDialogComponent { }

@Component({
  selector: 'app-conflict-section-dialog',
  templateUrl: 'conflict-section-dialog.html',
  styleUrls: ['conflict-section-dialog.css']
})
export class ConflictSectionDialogComponent { }
