
import { Book } from './book';

export interface BookDetails extends Book {
  chapters: any[];
  collaborators: any[];
  versions: any[];
  settings: Record<string, any>;
}
