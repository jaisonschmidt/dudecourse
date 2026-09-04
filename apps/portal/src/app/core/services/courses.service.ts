import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  CourseDetailDto,
  CourseSummaryDto,
  EnrollmentDto,
  JourneyItemDto,
  ProgressUpdateResultDto,
} from '@dudecourse/shared/domain';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCourses(): Observable<CourseSummaryDto[]> {
    return this.http.get<CourseSummaryDto[]>(`${this.apiUrl}/courses`);
  }

  getCourse(courseSlug: string): Observable<CourseDetailDto> {
    return this.http.get<CourseDetailDto>(`${this.apiUrl}/courses/${courseSlug}`);
  }

  enroll(courseId: string): Observable<EnrollmentDto> {
    return this.http.post<EnrollmentDto>(`${this.apiUrl}/courses/${courseId}/enrollments`, {});
  }

  updateProgress(
    enrollmentId: string,
    lessonId: string,
    watchedPercent: number
  ): Observable<ProgressUpdateResultDto> {
    return this.http.put<ProgressUpdateResultDto>(
      `${this.apiUrl}/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      { watchedPercent }
    );
  }

  getJourney(): Observable<JourneyItemDto[]> {
    return this.http.get<JourneyItemDto[]>(`${this.apiUrl}/me/journey`);
  }

  certificateUrl(certificateId: string): string {
    return `${this.apiUrl}/certificates/${certificateId}/pdf`;
  }
}
