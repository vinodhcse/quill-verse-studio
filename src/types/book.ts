
export interface Book {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  description: string;
  authorName: string;
  bookImage?: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: {
    id: string;
    versionNumber: number;
  };
}
