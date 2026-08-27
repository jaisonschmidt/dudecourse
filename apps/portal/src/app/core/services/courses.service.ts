import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CourseSummary, Lesson } from '../models/course.models';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCourses(): Observable<CourseSummary[]> {
    return this.http.get<CourseSummary[]>(`${this.apiUrl}/courses`);
  }

  getLessons(courseSlug: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/courses/${courseSlug}/lessons`);
  }

  getCourse(courseSlug: string): Observable<CourseSummary> {
    return this.http.get<CourseSummary>(`${this.apiUrl}/courses/${courseSlug}`);
  }

}