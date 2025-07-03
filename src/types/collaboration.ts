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
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  type: "Manuscript" | "Edition";
  status: string;
  collaborators?: CollaboratorInfo[];
  permissions?: {
    canEdit: boolean;
    canComment: boolean;
    canView: boolean;
  };
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
  wordCount: number; // Made required to match Dashboard usage
  role?: 'author' | 'editor' | 'reviewer';
  subtitle?: string;
  language?: string;
}

export interface BookDetails extends Book {
  description?: string;
  genre?: string;
  chapters: Chapter[];
  collaborators: CollaboratorInfo[];
  collaboratorIds: string[];
  versions: Version[];
  currentVersion: Version;
  settings: {
    trackChanges: boolean;
    allowComments: boolean;
    autoSave: boolean;
  };
}

export interface CollaboratorInfo {
  id: string;
  user_id: string;
  user_email: string;
  name: string;
  collaborator_type: string;
  addedBy: string;
  addedAt: string;
  expiresAt: string | null;
}

export interface CollaborationSession {
  id: string;
  bookId: string;
  versionId: string;
  participants: User[];
  activeUsers: User[];
  lastActivity: string;
}

export type CanvasNodeType =
  | 'Outline'
  | 'Act'
  | 'Chapter'
  | 'SceneBeats'
  | 'Character'
  | 'WorldLocation'
  | 'WorldObject'
  | 'Arc'
  | 'Chart';
