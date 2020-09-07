import { Component, OnInit, AfterViewInit, Inject, OnDestroy } from '@angular/core';
import { CourseDataService } from '../course-data.service';
import { MessageBusService } from '../message-bus.service';
import { MatDialog, MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-semester-planner',
  templateUrl: './semester-planner.component.html',
  styleUrls: ['./semester-planner.component.css']
})
export class SemesterPlannerComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly TOPICS = MessageBusService.TOPICS.SemesterPlannerComponent;
  private readonly SUBSCRIPTIONS: (Subscription | undefined)[] = [];

  semesterYears: [number, number, number] = [0, 0, 0];

  constructor(
    private readonly courseData: CourseDataService,
    private readonly messageBus: MessageBusService,
    private readonly dialog: MatDialog
  ) {
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.CourseDataService.data.updateAvailable,
      this.getSemesterYears.bind(this)
    ));
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.courseData.reload();
  }

  ngOnDestroy() {
    for (const subscription of this.SUBSCRIPTIONS) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }

  private getSemesterYears() {
    console.log('getSemesterYears');

    this.semesterYears = this.courseData.semesterYears;
    this.openPickSemesterDialog();
    // setTimeout(this.reloadWithSemester.bind(this, 'fall'), 1000);
  }

  private openPickSemesterDialog() {
    const dialogRef = this.dialog.open(
      PickSemesterDialogComponent,
      {
        data: {
          springYear: this.semesterYears[0],
          summerYear: this.semesterYears[1],
          fallYear: this.semesterYears[2]
        } as PickSemesterDialogData,
        autoFocus: true,
        disableClose: false
      } as MatDialogConfig
    );

    dialogRef.afterClosed().subscribe(this.reloadWithSemester.bind(this));
  }

  private reloadWithSemester(result: 'spring' | 'summer' | 'fall') {
    const index = ['spring', 'summer', 'fall'].indexOf(result);
    this.messageBus.cast(this.TOPICS.semester, [result, this.semesterYears[index]]);
  }
}

export interface PickSemesterDialogData {
  springYear: number;
  summerYear: number;
  fallYear: number;
}

@Component({
  selector: 'app-pick-semester-dialog',
  templateUrl: 'pick-semester-dialog.html',
  styleUrls: ['pick-semester-dialog.css']
})
export class PickSemesterDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: PickSemesterDialogData) { }
}
