
export interface User {
  id: string;
  name: string;
  role: 'author' | 'editor' | 'reviewer';
  color: string;
}

export interface ChangeLog {
  id: string;
  book_id: string;
  chapter_id: string;
  block_id: string;
  user_id: string;
  change_type: 'insert' | 'delete' | 'replace';
  before_text: string;
  after_text: string;
  start_offset: number;
  end_offset: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  comment?: string;
}

export interface ChapterBlock {
  id: string;
  chapter_id: string;
  position: number;
  type: 'page' | 'paragraph';
  text: string;
  rich_format: any; // TipTap JSON format
  change_suggestions: ChangeLog[];
}

export interface Comment {
  id: string;
  block_id: string;
  user_id: string;
  content: string;
  position: number;
  resolved: boolean;
  created_at: string;
  replies: Comment[];
}

export type EditMode = 'edit' | 'suggest' | 'review';
