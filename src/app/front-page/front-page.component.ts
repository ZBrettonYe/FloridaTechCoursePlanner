import { Component, OnInit, isDevMode } from '@angular/core';
import { LocalStorageService } from '../local-storage.service';

@Component({
  selector: 'app-front-page',
  templateUrl: './front-page.component.html',
  styleUrls: ['./front-page.component.css']
})
export class FrontPageComponent implements OnInit {
  versionInfo = '';

  constructor(
    private readonly localStorage: LocalStorageService
  ) { }

  ngOnInit(): void {
    this.versionInfo = 'Version 2, Revision 0';
    if (isDevMode()) {
      this.versionInfo += ', Development Build';
    } else {
      this.versionInfo += ', Production Build';
    }
  }

  resetSettings() {
    this.localStorage.clear();
  }
}
