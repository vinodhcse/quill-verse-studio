
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'author' | 'editor' | 'reviewer';
  isOnline?: boolean;
  lastSeen?: string;
  color?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  timestamp: string;
  position: number;
  resolved?: boolean;
  replies?: Comment[];
  created_at?: string;
  user_id?: string;
  block_id?: string;
}

export interface Change {
  id: string;
  type: 'insert' | 'delete' | 'format';
  content: string;
  author: User;
  timestamp: string;
  position: number;
  accepted?: boolean;
  rejected?: boolean;
}

export interface ChangeLog {
  id: string;
  type: 'insert' | 'delete' | 'format';
  content: string;
  author: User;
  timestamp: string;
  position: number;
  accepted?: boolean;
  rejected?: boolean;
  status?: 'pending' | 'accepted' | 'rejected';
  change_type?: string;
  before_text?: string;
  after_text?: string;
  comment?: string;
  user_id?: string;
  created_at?: string;
  block_id?: string;
}

export type EditMode = 'view' | 'edit' | 'review' | 'track-changes' | 'suggest';

export interface Version {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: User;
  content: string;
  wordCount?: number;
  isPublished?: boolean;
  collaborators: User[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  lastModified: string;
  versions: Version[];
}

export interface Book {
  id: string;
  title: string;
  authorname: string;
  bookImage?: string;
  lastModified: string;
  createdAt: string;
  wordCount?: number;
  role?: 'author' | 'editor' | 'reviewer';
  subtitle?: string;
  language?: string;
}

export interface BookDetails extends Book {
  description?: string;
  genre?: string;
  chapters: Chapter[];
  collaborators: User[];
  versions: Version[];
  currentVersion: Version;
  settings: {
    trackChanges: boolean;
    allowComments: boolean;
    autoSave: boolean;
  };
}

export interface CollaborationSession {
  id: string;
  bookId: string;
  versionId: string;
  participants: User[];
  activeUsers: User[];
  lastActivity: string;
}
