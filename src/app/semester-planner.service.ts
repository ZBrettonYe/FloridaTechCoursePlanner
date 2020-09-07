import { Injectable } from '@angular/core';
import { Section, CourseDataService } from './course-data.service';
import { MessageBusService } from './message-bus.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SemesterPlannerService {
  private readonly TOPICS = MessageBusService.TOPICS.SemesterPlannerService;

  private hoverSection: Section | null = null;
  private readonly sections: Section[] = [];

  private semester: 'spring' | 'summer' | 'fall';
  private year: number;

  constructor(
    private readonly messageBus: MessageBusService,
    private readonly courseData: CourseDataService,
    private readonly localStorage: LocalStorageService
  ) {
    console.log('construct');

    this.messageBus.on(
      MessageBusService.TOPICS.SemesterPlannerComponent.semester,
      (([semester, year]: ['spring' | 'summer' | 'fall', number]) => {
        this.semester = semester;
        this.year = year;
        this.restoreSections();
      }).bind(this)
    );

    // IDK why it's here
    // Commenting it out instead of deleting it, just to be safe
    // this.messageBus.on(
    //   MessageBusService.TOPICS.CourseDataService.reload.complete,
    //   (() => {
    //     this.restoreSections();
    //   }).bind(this)
    // );

    // this.restoreSections();
  }

  sectionMouseEnter(s: Section) {
    this.hoverSection = s;
    this.messageBus.cast(this.TOPICS.hoverSection.enter, this.hoverSection);
  }

  sectionMouseLeave() {
    this.hoverSection = null;
    this.messageBus.cast(this.TOPICS.hoverSection.leave);
  }

  sectionClick(s: Section) {
    // Remove the section if it's found in the list
    let index = this.sections.indexOf(s);
    if (index !== -1) {
      this.sections.splice(index, 1);
      this.saveSections();
      this.messageBus.cast(this.TOPICS.sections.update, this.sections);
      return;
    }

    // Remove the other section of the same course
    index = this.sections.findIndex(section => section.course === s.course);
    if (index !== -1) {
      this.sections.splice(index, 1, s);
      this.saveSections();
      this.messageBus.cast(this.TOPICS.sections.update, this.sections);
      return;
    }

    // Add the section
    this.sections.push(s);
    this.saveSections();
    this.messageBus.cast(this.TOPICS.sections.update, this.sections);
  }

  saveSections() {
    const crns = this.sections.map(s => s.crn);
    this.localStorage.set('SemesterPlannerService.sections.crns', crns);
  }

  restoreSections() {
    if (!this.semester || !this.courseData.sections.length) {
      return;
    }

    const crns: number[] | null = this.localStorage.get('SemesterPlannerService.sections.crns');
    let sections: Section[];

    if (crns !== null) {
      sections = this.courseData.sections.filter(
        s => crns.includes(s.crn) && s.year === this.year && s.semester === this.semester
      );
    } else {
      sections = [];
    }

    this.sections.length = 0;
    this.sections.push(...sections);
    this.messageBus.cast(this.TOPICS.sections.update, this.sections);
  }
}
