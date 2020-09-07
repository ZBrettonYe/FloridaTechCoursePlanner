import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MessageBusService } from './message-bus.service';

@Injectable({
  providedIn: 'root'
})
export class CourseDataService {
  /**
   * Some topics to subscribe to.
   */
  private readonly TOPICS = MessageBusService.TOPICS.CourseDataService;

  /**
   * Start downloading metadata and set to check metadata update every minute.
   * @param httpClient - {@link https://angular.io/api/common/http/HttpClient}
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly messageBus: MessageBusService,
  ) {
    setTimeout(this.loadMetaData.bind(this), 0);
    setInterval(this.loadMetaData.bind(this), 60 * 1000);
  }

  /**
   * Mapping from file path to file size in bytes.
   */
  private fileSizes = new Map<string, number>();

  /**
   * Time in milliseconds since epoch of when the data was generated.
   */
  public timestamp = 0;

  /**
   * Which year is of the 3 semesters.
   */
  public semesterYears: [number, number, number] = [0, 0, 0];

  buildings: Building[] = [];
  campuses: string[] = [];
  courseAttributes: string[] = [];
  departments: Department[] = [];
  descriptions: string[] = [];
  employees: Employee[] = [];
  levels: string[] = [];
  notes: string[] = [];
  prerequisites: string[] = [];
  requirements: string[] = [];
  restrictions: string[] = [];
  scheduleTypes: string[] = [];
  sessions: string[] = [];
  tags: Tag[] = [];
  titles: string[] = [];
  sections: Section[] = [];
  courses: Course[] = [];
  subjects: Subject[] = [];

  /**
   * The list of attributes of each asset file.
   */
  private readonly assetAttributes = [
    {
      path: 'building.min.json',
      fromMinJson: Building.fromMinJson,
      property: this.buildings
    }, {
      path: 'campus.min.json',
      fromMinJson: this.copyString,
      property: this.campuses
    }, {
      path: 'courseAttribute.min.json',
      fromMinJson: this.copyString,
      property: this.courseAttributes
    }, {
      path: 'department.min.json',
      fromMinJson: Department.fromMinJson,
      property: this.departments
    }, {
      path: 'description.min.json',
      fromMinJson: this.copyString,
      property: this.descriptions
    }, {
      path: 'employee.min.json',
      fromMinJson: Employee.fromMinJson,
      property: this.employees
    }, {
      path: 'level.min.json',
      fromMinJson: this.copyString,
      property: this.levels
    }, {
      path: 'note.min.json',
      fromMinJson: this.copyString,
      property: this.notes
    }, {
      path: 'prerequisite.min.json',
      fromMinJson: this.copyString,
      property: this.prerequisites
    }, {
      path: 'requirement.min.json',
      fromMinJson: this.copyString,
      property: this.requirements
    }, {
      path: 'restriction.min.json',
      fromMinJson: this.copyString,
      property: this.restrictions
    }, {
      path: 'scheduleType.min.json',
      fromMinJson: this.copyString,
      property: this.scheduleTypes
    }, {
      path: 'session.min.json',
      fromMinJson: this.copyString,
      property: this.sessions
    }, {
      path: 'tag.min.json',
      fromMinJson: Tag.fromMinJson,
      property: this.tags
    }, {
      path: 'title.min.json',
      fromMinJson: this.copyString,
      property: this.titles
    }, {
      path: 'section.min.json',
      fromMinJson: Section.fromMinJson,
      property: this.sections
    }, {
      path: 'course3.min.json',
      fromMinJson: Course.fromMinJson,
      property: this.courses
    }, {
      path: 'subject.min.json',
      fromMinJson: Subject.fromMinJson,
      property: this.subjects
    }
  ];

  /**
   * Temporarily store asset data before expansion.
   */
  private readonly assetCache = new Map<string, any[][] | string[]>();

  /**
   * Initiate downloading metadata file.
   * @param forceReload - Forcefully overwrite current timestamp
   */
  private loadMetaData(forceReload = false) {
    if (forceReload) {
      this.timestamp = -1;
    }

    // When successful, save the data
    // When error, do nothing
    this.httpClient.get('assets/data/metaData.min.json')
      .subscribe(this.saveMetaData.bind(this));
  }

  /**
   * Save metadata.
   */
  private saveMetaData(data: MetaData) {
    const updateAvailable = this.timestamp !== data.timestamp;

    this.fileSizes = new Map(Object.entries(data.fileSizes));
    this.timestamp = data.timestamp;
    this.semesterYears = data.years;

    if (updateAvailable) {
      this.messageBus.cast(this.TOPICS.data.updateAvailable);
    }
  }

  /**
   * Start the process of reloading data from server.
   * It whips existing stored data and replace it with a new copy downloaded form the server.
   * The clients should subscribe to topics before calling this function.
   * This function is usually called when initializing the view.
   */
  public reload() {
    this.loadMetaData(true);
    this.load(0);
  }

  /**
   * Start downloading asset at index and report progress.
   * If the last asset has been downloaded, start expanding downloaded data.
   * @param index - Which asset should be downloaded.
   */
  private load(index: number) {
    // If all has been downloaded, start expanding data
    if (index === this.assetAttributes.length) {
      this.expand();
      return;
    }

    // Start downloading
    const path = this.assetAttributes[index].path;
    this.httpClient.get(`assets/data/${path}`).subscribe({
      // Save data when finished
      next: this.save.bind(this, index),
      // Directly report the error without doing anything else
      error: this.error.bind(this)
    });

    // Report progress
    this.messageBus.cast(
      this.TOPICS.reload.progress,
      {
        path,
        size: this.fileSizes.get(path) ?? 0,
        index,
        total: this.fileSizes.size
      } as ReloadProgress
    );
  }

  /**
   * Save asset data to cache and start downloading next asset.
   * @param index - Which asset should be downloaded.
   * @param data - Downloaded JSON data already parsed into basic objects.
   */
  private save(index: number, data: MinimizedJson | string[]) {
    // Using path as the unique identifier
    const path = this.assetAttributes[index].path;

    // Can't do instanceof MinimizedJson because it's an interface
    if (data instanceof Array) {
      this.assetCache.set(path, data);
    } else {
      this.assetCache.set(path, data.values);
    }

    // Load next asset
    this.load(index + 1);
  }

  /**
   * When unable to download an asset, clear asset cache to save memory and report the error.
   * The currently present course data is not modified.
   * @param err - Error object supplied by HttpClient.
   */
  private error(err: any) {
    this.assetCache.clear();
    this.messageBus.cast(this.TOPICS.reload.error, err);
  }

  /**
   * Expand asset from its minimized form into expanded form.
   * The currently present course data is modified.
   */
  private expand() {
    // Construct object from minimized JSON
    for (const assetAttribute of this.assetAttributes) {
      const path = assetAttribute.path;
      const fromMinJson = assetAttribute.fromMinJson;
      const property = assetAttribute.property;

      property.length = 0;

      for (const value of this.assetCache.get(path) ?? []) {
        // @ts-ignore
        property.push(fromMinJson(this, value));
      }
    }

    // Further process sections and courses due to dependency issues in last step
    for (const section of this.sections) {
      const courseId = section.courseId;
      section.course = this.courses[courseId];
    }
    for (const course of this.courses) {
      const subjectId = course.subjectId;
      course.subject = this.subjects[subjectId];
    }

    // Cleanup and report completion
    this.assetCache.clear();
    this.messageBus.cast(this.TOPICS.reload.complete);

    // console.log(this);
  }

  /**
   * Returns whatever string is passed as parameter.
   * @remarks
   * This function is used when constructing course data.
   * Sometimes it only needs to copy the string, so this function is used in place of the fromMinJson function.
   * @param _courseDataService Unused.
   * @param str - The string to be returned.
   * @returns The string on the parameter.
   */
  private copyString(_courseDataService: CourseDataService, str: string) {
    return str;
  }
}

/**
 * The content of a bundle when reporting asset load progress.
 */
export interface ReloadProgress {
  /**
   * Path of the file without "assets/data/" prefix.
   */
  path: string;

  /**
   * File size in bytes.
   */
  size: number;

  /**
   * Index of the asset.
   */
  index: number;

  /**
   * How many assets are in total.
   */
  total: number;
}

/**
 * The file structure of .min.json file
 */
interface MinimizedJson {
  /**
   * Property names of each object field.
   */
  keys: string[];

  /**
   * Values of each objects' fields.
   */
  values: any[][];
}

interface MetaData {
  fileSizes: any;
  timestamp: number;
  years: [number, number, number];
}

export class Building {
  constructor(
    public readonly code: string = '',
    public readonly name: string = ''
  ) { }

  static fromMinJson(_courseDataService: CourseDataService, args: any[]): Building {
    return new Building(...args);
  }
}

export class Department {
  constructor(
    public readonly code: string = '',
    public readonly name: string = '',
    public readonly phone: string | null = null,
    public readonly fax: string | null = null,
    public readonly email: string | null = null,
    public readonly website: string | null = null,
    public readonly building: Building | null = null
  ) { }

  static fromMinJson(courseDataService: CourseDataService, args: any[]): Department {
    const [
      code, name, phone, fax,
      email, website, buildingId
    ] = args;

    let building: Building | null = null;
    if (buildingId !== -1) {
      building = courseDataService.buildings[buildingId];
    }

    return new Department(
      code, name, phone, fax,
      email, website, building
    );
  }
}

export class Employee {
  constructor(
    public readonly name: string = '',
    public readonly title: string | null = null,
    public readonly email: string = '',
    public readonly phone: string | null = null,
    public readonly building: Building | null = null,
    public readonly room: string | null = null,
    public readonly department: Department | null = null
  ) { }

  static fromMinJson(courseDataService: CourseDataService, args: any[]): Employee {
    const [name, title, email, phone,
      buildingId, room, departmentId
    ] = args;

    let building: Building | null = null;
    if (buildingId !== -1) {
      building = courseDataService.buildings[buildingId];
    }

    let department: Department | null = null;
    if (departmentId !== -1) {
      department = courseDataService.departments[departmentId];
    }

    return new Employee(
      name, title, email, phone,
      building, room, department
    );
  }
}

export class Tag {
  constructor(
    public readonly code: string = '',
    public readonly name: string = ''
  ) { }

  static fromMinJson(_courseDataService: CourseDataService, args: any[]): Tag {
    return new Tag(...args);
  }
}

export class Subject {
  constructor(
    public readonly code: string = '',
    public readonly name: string = '',
    public readonly courses: Course[] = []
  ) { }

  static fromMinJson(courseDataService: CourseDataService, args: any[]): Subject {
    const [code, name, courseIdStart, courseIdEnd] = args;

    const courses = courseDataService.courses.slice(courseIdStart, courseIdEnd);

    return new Subject(code, name, courses);
  }

  copy(campus: string, semester: 'spring' | 'summer' | 'fall') {
    return new Subject(
      this.code,
      this.name,
      this.courses.filter(c => c.campus === campus && c.semester === semester)
    );
  }
}

export class Course {
  public subject: Subject;

  constructor(
    public readonly subjectId: number = -1,
    public readonly course: number = -1,
    public readonly campus: string = '',
    public readonly semester: string = '',
    public readonly year: number = -1,
    public readonly creditHours: [number, number] = [-1, -1],
    public readonly sections: Section[] = [],
    public readonly title: string = '',
    public readonly description: string | null = null,
    public readonly tags: Tag[] = [],
    public readonly lectureHours: number = -1,
    public readonly labHours: number | null = null,
    public readonly level: string = '',
    public readonly scheduleTypes: string[] = [],
    public readonly restrictions: string[] = [],
    public readonly prerequisite: string | null = null,
    public readonly courseAttributes: string[] = []
  ) { }

  static fromMinJson(courseDataService: CourseDataService, args: any[]): Course {
    const [
      subjectId, course, campusId, semesterId,
      year, creditHours, sectionIds, titleId,
      descriptionId, tagIds, lectureHours, labHours,
      levelId, scheduleTypeIds, restrictionIds, prerequisiteId,
      courseAttributeIds
    ] = args;

    let campus = '';
    if (campusId !== -1) {
      campus = courseDataService.campuses[campusId];
    }

    let semester = '';
    if (semesterId !== -1) {
      semester = ['spring', 'summer', 'fall'][semesterId];
    }

    const sections = (sectionIds as number[]).map(
      sectionId => courseDataService.sections[sectionId]
    );

    let title = '';
    if (titleId !== -1) {
      title = courseDataService.titles[titleId];
    }

    let description: string | null = null;
    if (descriptionId !== -1) {
      description = courseDataService.descriptions[descriptionId];
    }

    const tags = (tagIds as number[]).map(
      tagId => courseDataService.tags[tagId]
    );

    const level = courseDataService.levels[levelId];

    const scheduleTypes = (scheduleTypeIds as number[]).map(
      scheduleTypeId => courseDataService.scheduleTypes[scheduleTypeId]
    );

    const restrictions = (restrictionIds as number[]).map(
      restrictionId => courseDataService.restrictions[restrictionId]
    );

    let prerequisite: string | null = null;
    if (prerequisiteId !== -1) {
      prerequisite = courseDataService.prerequisites[prerequisiteId];
    }

    const courseAttributes = (courseAttributeIds as number[]).map(
      courseAttributeId => courseDataService.courseAttributes[courseAttributeId]
    );

    return new Course(
      subjectId, course, campus, semester,
      year, creditHours, sections, title,
      description, tags, lectureHours, labHours,
      level, scheduleTypes, restrictions, prerequisite,
      courseAttributes
    );
  }
}

export class Section {
  public course: Course;

  constructor(
    public readonly campus: string = '',
    public readonly semester: string = '',
    public readonly year: number = -1,
    public readonly crn: number = -1,
    public readonly courseId: number = -1,
    public readonly section: string = '',
    public readonly creditHours: [number, number] = [-1, -1],
    public readonly cap: [number, number] = [-1, -1],
    public readonly waitListSeats: [number, number] = [-1, -1],
    public readonly title: string = '',
    public readonly notes: string[] = [],
    public readonly session: string | null = null,
    public readonly instructor: Employee | null = null,
    public readonly syllabus: string | null = null,
    public readonly crossListCourses: [string, number][] = [],
    public readonly schedules: SectionSchedule[] = [],
    public readonly level: string = '',
    public readonly restrictions: string[] = []
  ) { }

  static fromMinJson(courseDataService: CourseDataService, args: any[]): Section {
    const [
      campusId, semesterId, year, crn,
      courseId, section, creditHours, cap,
      waitListSeats, titleId, noteIds, sessionId,
      instructorId, syllabus, crossListCourses, schedules,
      levelId, restrictionIds
    ] = args;

    let campus = '';
    if (campusId !== -1) {
      campus = courseDataService.campuses[campusId];
    }

    let semester = '';
    if (semesterId !== -1) {
      semester = ['spring', 'summer', 'fall'][semesterId];
    }

    let title = '';
    if (titleId !== -1) {
      title = courseDataService.titles[titleId];
    }

    const notes = (noteIds as number[]).map(
      noteId => courseDataService.notes[noteId]
    );

    let session: string | null = null;
    if (sessionId !== -1) {
      session = courseDataService.sessions[sessionId];
    }

    let instructor: Employee | null = null;
    if (instructorId !== -1) {
      instructor = courseDataService.employees[instructorId];
    }

    const schedules2 = (schedules as [string, number, number, number | string | null, string][]).map(
      (schedule): SectionSchedule => {
        const s = {
          days: schedule[0],
          startTime: schedule[1],
          endTime: schedule[2],
          room: schedule[4],
        } as SectionSchedule;

        const building = schedule[3];
        if (typeof (building) === 'number') {
          s.building = courseDataService.buildings[building];
        } else {
          s.building = building;
        }

        return s;
      }
    );

    const level = courseDataService.levels[levelId];

    const restrictions = (restrictionIds as number[]).map(
      restrictionId => courseDataService.restrictions[restrictionId]
    );

    return new Section(
      campus, semester, year, crn,
      courseId, section, creditHours, cap,
      waitListSeats, title, notes, session,
      instructor, syllabus, crossListCourses, schedules2,
      level, restrictions
    );
  }
}

export interface SectionSchedule {
  days: string;
  startTime: number;
  endTime: number;
  building: Building | string | null;
  room: string;
}
