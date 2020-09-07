import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CourseDataService } from '../course-data.service';

@Component({
  selector: 'app-section-explorer',
  templateUrl: './section-explorer.component.html',
  styleUrls: ['./section-explorer.component.css']
})
export class SectionExplorerComponent implements OnInit, AfterViewInit {

  constructor(
    private readonly courseData: CourseDataService
  ) { }

  ngOnInit(): void { }

  /**
   * Manually reload data each time the tool is opened.
   * Otherwise course data service would not fire message and it looks like there's no data loaded.
   */
  ngAfterViewInit() {
    this.courseData.reload();
  }
}
