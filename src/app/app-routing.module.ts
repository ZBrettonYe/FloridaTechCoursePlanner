import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FrontPageComponent } from './front-page/front-page.component';
import { SectionExplorerComponent } from './section-explorer/section-explorer.component';
import { SemesterPlannerComponent } from './semester-planner/semester-planner.component';

const routes: Routes = [
  { path: '', component: FrontPageComponent, pathMatch: 'full' },
  { path: 'section-explorer', component: SectionExplorerComponent, pathMatch: 'full' },
  { path: 'semester-planner', component: SemesterPlannerComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
