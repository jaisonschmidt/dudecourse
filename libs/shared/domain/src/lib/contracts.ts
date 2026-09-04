export interface UserDto {
  id: string;
  email: string;
  displayName: string;
}

export interface ApiErrorDto {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface RegisterRequestDto {
  displayName: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface CourseSummaryDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
}

export interface LessonProgressDto {
  lessonId: string;
  watchedPercent: number;
  completedAt: string | null;
}

export interface LessonDto {
  id: string;
  title: string;
  youtubeVideoId: string;
  position: number;
  progress: LessonProgressDto | null;
}

export interface CertificateDto {
  id: string;
  serialCode: string;
  learnerName: string;
  courseTitle: string;
  issuedAt: string;
}

export interface EnrollmentDto {
  id: string;
  enrolledAt: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  certificate: CertificateDto | null;
}

export interface CourseDetailDto extends CourseSummaryDto {
  lessons: LessonDto[];
  enrollment: EnrollmentDto | null;
}

export interface JourneyItemDto {
  course: CourseSummaryDto;
  enrollment: EnrollmentDto;
}

export interface ProgressUpdateRequestDto {
  watchedPercent: number;
}

export interface ProgressUpdateResultDto {
  lessonProgress: LessonProgressDto;
  courseProgressPercent: number;
  completedLessons: number;
  totalLessons: number;
  certificate: CertificateDto | null;
}
