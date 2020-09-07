import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageBusService {
  /**
   * List of all topics for each class.
   */
  static readonly TOPICS = {
    CourseDataService: {
      reload: {
        progress: 'CourseDataService.reload.progress',
        complete: 'CourseDataService.reload.complete',
        error: 'CourseDataService.reload.error'
      },
      data: {
        updateAvailable: 'CourseDataService.data.updateAvailable'
      }
    },
    CourseSelectorCardComponent: {
      gotoCourse: 'CourseSelectorCardComponent.gotoCourse'
    },
    SectionFilterCardComponent: {
      newFilterFn: 'SectionFilterCardComponent.newFilterFn',
      resetFilters: 'SectionFilterCardComponent.resetFilters'
    },
    SectionFilterOptionComponent: {
      update: 'SectionFilterOptionComponent.update'
    },
    SectionTableCardComponent: {
      click: 'SectionTableCardComponent.click',
      mouseover: 'SectionTableCardComponent.mouseover'
    },
    SemesterPlannerComponent: {
      semester: 'SemesterPlannerComponent.semester'
    },
    SemesterPlannerService: {
      sections: {
        update: 'SemesterPlannerService.sections.update'
      },
      hoverSection: {
        enter: 'SemesterPlannerService.hoverSection.enter',
        leave: 'SemesterPlannerService.hoverSection.leave',
      }
    }
  };

  /**
   * Mapping from topic to EventEmitter for that topic.
   */
  private channels = new Map<string, EventEmitter<any>>();

  /**
   * Set of topics to have debugging output.
   */
  private probeTopics = new Set<string>();

  constructor() { }

  /**
   * Subscribe to a topic.
   * The caller should supply a callback function for when the topic was casted.
   * @param topic - A given topic.
   * @param callback - The function to call when the topic is casted.
   * @returns The Subscription object that can be used to unsubscribe from the topic.
   */
  on(topic: string, callback: any) {
    // If the topic does not exist, create a topic
    if (!this.channels.has(topic)) {
      this.channels.set(topic, new EventEmitter(true));
    }

    // If the topic should be probed, print debug info
    if (this.probeTopics.has(topic)) {
      console.log('on(', topic, callback, ')');
    }

    const eventEmitter = this.channels.get(topic);
    return eventEmitter?.subscribe(callback);
  }

  /**
   * Send a message under given topic.
   *
   * @param topic - A given topic.
   * @param message - The data to be sent to subscribers.
   */
  cast(topic: string, message?: any) {
    // If the topic does not exist, create a topic
    if (!this.channels.has(topic)) {
      this.channels.set(topic, new EventEmitter(true));
    }

    // If the topic should be probed, print debug info
    if (this.probeTopics.has(topic)) {
      console.log('cast(', topic, message, ')');
    }

    const eventEmitter = this.channels.get(topic);
    eventEmitter?.emit(message);
  }

  /**
   * Enable debugging output for a topic.
   * @param topic - A given topic.
   */
  probe(topic: string) {
    this.probeTopics.add(topic);
  }
}
