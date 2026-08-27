export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
}

export interface Lesson {
  id: string;
  title: string;
  youtubeVideoId: string;
  position: number;
}
