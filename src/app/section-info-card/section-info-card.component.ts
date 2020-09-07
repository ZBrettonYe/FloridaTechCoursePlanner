import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MessageBusService } from '../message-bus.service';
import { CourseDataService, Section, Course, Employee } from '../course-data.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LocalStorageService } from '../local-storage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-section-info-card',
  templateUrl: './section-info-card.component.html',
  styleUrls: ['./section-info-card.component.css', '../prerequisite-highlight.css', '../bootstrap.badge.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SectionInfoCardComponent implements OnInit, OnDestroy {
  private readonly SUBSCRIPTIONS: (Subscription | undefined)[] = [];

  section: Section;
  course: Course;
  instructor: Employee | null;

  sectionOrders = Array(6).fill(null).map((_value, index) => index);
  courseOrders = Array(5).fill(null).map((_value, index) => index);
  instructorOrders = Array(4).fill(null).map((_value, index) => index);

  constructor(
    private readonly messageBus: MessageBusService,
    private readonly courseData: CourseDataService,
    private readonly localStorage: LocalStorageService
  ) {
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SectionTableCardComponent.mouseover,
      this.mouseover.bind(this)
    ));
  }

  ngOnInit(): void {
    this.recallOrders();
  }

  ngOnDestroy() {
    for (const subscription of this.SUBSCRIPTIONS) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }

  mouseover(index: number) {
    const section = this.courseData.sections[index];
    this.section = section;
    this.course = section.course;
    this.instructor = section.instructor;
  }

  drop(orders: number[], event: CdkDragDrop<string[]>) {
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

    // console.log(orders, prev, curr);
    this.saveOrders();
  }

  recallOrders() {
    const sectionOrders: number[] | null = this.localStorage.get('SectionInfoCardComponent.sectionOrders');
    if (sectionOrders && sectionOrders.length === this.sectionOrders.length) {
      this.sectionOrders = sectionOrders;
    }

    const courseOrders: number[] | null = this.localStorage.get('SectionInfoCardComponent.courseOrders');
    if (courseOrders && courseOrders.length === this.courseOrders.length) {
      this.courseOrders = courseOrders;
    }

    const instructorOrders: number[] | null = this.localStorage.get('SectionInfoCardComponent.instructorOrders');
    if (instructorOrders && instructorOrders.length === this.instructorOrders.length) {
      this.instructorOrders = instructorOrders;
    }
  }

  saveOrders() {
    this.localStorage.set('SectionInfoCardComponent.sectionOrders', this.sectionOrders);
    this.localStorage.set('SectionInfoCardComponent.courseOrders', this.courseOrders);
    this.localStorage.set('SectionInfoCardComponent.instructorOrders', this.instructorOrders);
  }
}
