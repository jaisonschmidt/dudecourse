import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home.page';
import { CoursePageComponent } from './pages/course/course.page';
import { LoginPageComponent } from './pages/auth/login.page';
import { RegisterPageComponent } from './pages/auth/register.page';
import { AuthCallbackPageComponent } from './pages/auth/auth-callback.page';
import { JourneyPageComponent } from './pages/journey/journey.page';
import { LessonPageComponent } from './pages/lesson/lesson.page';
import { AboutPageComponent } from './pages/about/about.page';
import { NotFoundPageComponent } from './pages/not-found.page';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'auth/callback', component: AuthCallbackPageComponent },
  { path: 'courses/:slug', component: CoursePageComponent },
  { path: 'courses/:slug/lessons/:lessonId', component: LessonPageComponent },
  { path: 'journey', component: JourneyPageComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutPageComponent },
  { path: '**', component: NotFoundPageComponent },
];
