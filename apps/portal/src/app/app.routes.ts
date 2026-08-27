import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home.page';
import { CoursePageComponent } from './pages/course/course.page';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'courses/:slug', component: CoursePageComponent },
];
