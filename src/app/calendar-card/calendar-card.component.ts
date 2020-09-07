import { Component, OnInit, ViewEncapsulation, AfterViewInit, OnDestroy } from '@angular/core';
import { MessageBusService } from '../message-bus.service';
import { Section, CourseDataService } from '../course-data.service';
import { CalendarEvent } from 'angular-calendar';
import { EventColor } from 'calendar-utils';
import { Subject, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PDFDocument, PDFPageDrawTextOptions } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { SemesterPlannerService } from '../semester-planner.service';

@Component({
  selector: 'app-calendar-card',
  templateUrl: './calendar-card.component.html',
  styleUrls: ['./calendar-card.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CalendarCardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly SUBSCRIPTIONS: (Subscription | undefined)[] = [];

  readonly viewDate = new Date();
  events: CalendarEvent<Section>[] = [];
  readonly refresh = new Subject<undefined>();

  sections: Section[] = [];
  hoverSection: Section | null = null;
  nSectionsNotShown = 0;

  private semester: 'spring' | 'summer' | 'fall';
  private year: number;

  readonly studentInfoFormFields: StudentInfoFormField[] = [
    {
      label: 'Student ID Number',
      placeholder: '9XXXXXXXX',
      value: '',
      textOptions: { x: 90, y: 648, size: 10}
    }, {
      label: 'Major Code',
      placeholder: '',
      value: '',
      textOptions: { x: 280, y: 648, size: 10 }
    }, {
      label: 'Local Phone Number',
      placeholder: '',
      value: '',
      textOptions: { x: 425, y: 648, size: 10 }
    }, {
      label: 'Last Name',
      placeholder: '',
      value: '',
      textOptions: { x: 90, y: 628, size: 10 }
    }, {
      label: 'First Name',
      placeholder: '',
      value: '',
      textOptions: { x: 280, y: 628, size: 10 }
    }, {
      label: 'Middle Name',
      placeholder: '',
      value: '',
      textOptions: { x: 425, y: 628, size: 10 }
    }, {
      label: 'Street/Apt. No.',
      placeholder: '',
      value: '',
      textOptions: { x: 115, y: 605, size: 10 }
    }, {
      label: 'City',
      placeholder: '',
      value: '',
      textOptions: { x: 260, y: 605, size: 10 }
    }, {
      label: 'State',
      placeholder: '',
      value: '',
      textOptions: { x: 350, y: 605, size: 10 }
    }, {
      label: 'ZIP',
      placeholder: '',
      value: '',
      textOptions: { x: 395, y: 605, size: 10 }
    }, {
      label: 'Florida Tech Box No.',
      placeholder: '',
      value: '',
      textOptions: { x: 505, y: 605, size: 10 }
    }
  ];

  constructor(
    private readonly messageBus: MessageBusService,
    private readonly httpClient: HttpClient,
    private readonly courseData: CourseDataService,
    private readonly semesterPlanner: SemesterPlannerService
  ) {
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SemesterPlannerService.sections.update,
      this.sectionsUpdate.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SemesterPlannerService.hoverSection.enter,
      this.hoverSectionEnter.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SemesterPlannerService.hoverSection.leave,
      this.hoverSectionLeave.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SemesterPlannerComponent.semester,
      (([semester, year]: ['spring' | 'summer' | 'fall', number]) => {
        this.semester = semester;
        this.year = year;
      }).bind(this)
    ));
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    // Scroll 8 AM into top of the calendar
    const eightAmElement = document.querySelector('div.cal-time-label-column > div.cal-hour:nth-child(9)');
    eightAmElement?.scrollIntoView();

    // @ts-ignore
    // document.getElementById('regForm').innerHTML = '<embed src="assets/form/registrationForm.pdf" style="width: 100%; height: 100%;">';
  }

  ngOnDestroy() {
    for (const subscription of this.SUBSCRIPTIONS) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }

  removeSection(section: Section) {
    this.semesterPlanner.sectionClick(section);
  }

  gotoCourse(section: Section) {
    this.messageBus.cast(
      MessageBusService.TOPICS.CourseSelectorCardComponent.gotoCourse,
      section
    );
  }

  eventClicked({ event }: { event: CalendarEvent, sourceEvent: MouseEvent }) {
    const section: Section = event.meta;
    this.gotoCourse(section);
  }

  private sectionsUpdate(sections: Section[]) {
    this.sections = sections;
    if (this.hoverSection && sections.includes(this.hoverSection)) {
      this.hoverSection = null;
    }

    const [events, nSectionsNotShown] = this.generateEvents(this.sections);
    this.events = events;
    this.nSectionsNotShown = nSectionsNotShown;
    this.refresh.next();
  }

  private hoverSectionEnter(section: Section) {
    if (!this.sections.includes(section)) {
      const [events] = this.generateEvents([section], {primary: 'orange', secondary: ''});
      this.events.push(...events);
      this.hoverSection = section;
      this.refresh.next();
    }
  }

  private hoverSectionLeave() {
    if (this.hoverSection) {
      this.events = this.events.filter(event => event.meta !== this.hoverSection);
      this.hoverSection = null;
      this.refresh.next();
    }
  }

  private generateEvents(sections: Section[], color?: EventColor): [CalendarEvent<Section>[], number] {
    const events: CalendarEvent<Section>[] = [];
    let nSectionsNotShown = 0;

    for (const section of sections) {
      let generatedEventTime = false;

      for (const schedule of section.schedules) {
        for (const dayChar of schedule.days) {
          const startTime = this.generateEventTime(dayChar, schedule.startTime);
          const endTime = this.generateEventTime(dayChar, schedule.endTime);
          events.push(
            {
              start: startTime,
              end: endTime,
              title: section.title,
              color,
              meta: section
            } as CalendarEvent<Section>
          );
          generatedEventTime = true;
        }
      }

      if (!generatedEventTime) {
        nSectionsNotShown++;
      }
    }

    return [events, nSectionsNotShown];
  }

  private generateEventTime(dayChar: string, time: number) {
    const dayChars = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
    const dayIndex = dayChars.indexOf(dayChar);

    const date = new Date();
    // Calculate date of Sunday and add weekday offset
    date.setDate(date.getDate() - date.getDay() + dayIndex);
    // Calculate hours by int div 100
    date.setHours(Math.floor(time / 100));
    // Calculate minute by mod 100
    date.setMinutes(time % 100);
    // Hard code seconds to 0
    date.setSeconds(0);

    return date;
  }

  async generateRegForm() {
    const startTimestamp = (new Date()).getTime();

    const courseInfoLines = this.generateCourseInfoLines();

    const blankFormData = await this.httpClient.get('assets/form/registrationForm.pdf', { responseType: 'arraybuffer' }).toPromise();
    const blankForm = await PDFDocument.load(blankFormData);
    const form = await PDFDocument.create();

    await this.fillRegFormCourseInfo(form, blankForm, courseInfoLines);
    this.fillRegFormStudentInfo(form);
    this.fillRegFormMiscellaneous(form, startTimestamp);

    // Generate binary data and show on HTML
    const formFile = await form.save();
    const blob = new Blob([formFile], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    // @ts-ignore
    document.getElementById('regForm').innerHTML = `<embed src="${blobUrl}" style="width: 100%; height: 100%;">`;
  }

  private generateCourseInfoLines() {
    const courseInfoLines: CourseInfoLine[] = [];
    // for (const section of this.courseData.sections.filter(s => [26664, 24410, 22228, 18054, 24308, 22355].includes(s.crn))) {
    for (const section of this.sections) {
      let line: CourseInfoLine = {
        crn: section.crn.toString(),
        prefix: section.course.subject.code,
        courseNo: section.course.course.toString(),
        sec: section.section,
        courseTitle: section.title,
        days: '',
        time: ['', ''],
        crs: section.creditHours[0] === section.creditHours[1] ? section.creditHours[0].toString() : ''
      };

      if (section.schedules.length === 0) {
        courseInfoLines.push(line);
        continue;
      }

      for (const schedule of section.schedules) {
        line.days = schedule.days;
        line.time = [schedule.startTime.toString(), schedule.endTime.toString()];

        courseInfoLines.push(line);
        line = {
          crn: '',
          prefix: '',
          courseNo: '',
          sec: '',
          courseTitle: '',
          days: '',
          time: ['', ''],
          crs: ''
        };
      }
    }

    return courseInfoLines;
  }

  private async fillRegFormCourseInfo(form: PDFDocument, blankForm: PDFDocument, courseInfoLines: CourseInfoLine[]) {
    // Force adding a blank line if there's no line. This prevents showing a blank page
    if (courseInfoLines.length === 0) {
      form.addPage((await form.copyPages(blankForm, [0]))[0]);
      return;
    }

    // Has to assign some values to these variables to make ts-lint happy. They will be reassigned when i == 0
    let page = blankForm.getPage(0);
    let y = 0;

    for (const [i, line] of courseInfoLines.entries()) {
      if (i % 8 === 0) {
        [page] = await form.copyPages(blankForm, [0]);
        form.addPage(page);
        y = 540;
      }

      page.drawText(line.crn, { x: 45, y, size: 10 });
      page.drawText(line.prefix, { x: 100, y, size: 10 });
      page.drawText(line.courseNo, { x: 135, y, size: 10 });
      page.drawText(line.sec, { x: 188, y, size: 10 });
      page.drawText(line.courseTitle, { x: 215, y, size: 10 });
      page.drawText(line.days, { x: 440, y, size: 10 });
      page.drawText(line.time[0], { x: 490, y: y + 8, size: 10 });
      page.drawText(line.time[1], { x: 505, y, size: 10 });
      page.drawText(line.crs, { x: 540, y, size: 10 });

      y -= 24;
    }
  }

  private fillRegFormStudentInfo(form: PDFDocument) {
    for (const page of form.getPages()) {
      // Year
      page.drawText(`${this.year}`, { x: 105, y: 694, size: 10 });

      // Semester
      const index = ['fall', 'spring', 'summer'].indexOf(this.semester);
      page.drawSquare({ x: [191, 230, 278][index], y: 694, size: 8 });

      // Date
      page.drawText((new Date()).toDateString(), { x: 435, y: 694, size: 10 });

      // Student Info
      for (const field of this.studentInfoFormFields) {
        page.drawText(field.value, field.textOptions);
      }
    }
  }

  private fillRegFormMiscellaneous(form: PDFDocument, startTimestamp: number) {
    const tDataGenerated = this.courseData.timestamp;
    const tFormGenerated = `${(new Date()).getTime() / 1000}`;
    const tElapsed = `${((new Date()).getTime() - startTimestamp) / 1000}`;
    const uuid = uuidv4();

    for (const [i, page] of form.getPages().entries()) {
      page.drawText(`// tD = ${tDataGenerated}`, {x: 30, y: 364, size: 7});
      page.drawText(`// tF = ${tFormGenerated}`, {x: 30, y: 358, size: 7});
      page.drawText(`// tE = ${tElapsed}`, {x: 30, y: 352, size: 7});
      page.drawText(`// r = ${uuid}`, {x: 30, y: 346, size: 7});

      page.drawText(`(Page ${i + 1} of ${form.getPages().length})`, {x: 280, y: 355, size: 12});
    }
  }
}

interface StudentInfoFormField {
  label: string;
  placeholder: string;
  value: string;
  textOptions: PDFPageDrawTextOptions;
}

interface CourseInfoLine {
  crn: string;
  prefix: string;
  courseNo: string;
  sec: string;
  courseTitle: string;
  days: string;
  time: [string, string];
  crs: string;
}
