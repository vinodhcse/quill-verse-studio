
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Book {
  id: string;
  title: string;
  authorname: string; // Fixed property name
  bookImage?: string;
  lastModified: string;
  createdAt: string;
  wordCount: number;
}

interface BookCardProps {
  book: Book;
  onSelect: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const getLastModifiedText = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 group hover:scale-[1.02]"
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg w-full">
          {book.bookImage ? (
            <img
              src={book.bookImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Book size={32} className="text-primary/60" />
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">by {book.authorname}</p>
          
          <div className="text-xs text-muted-foreground">
            <span>{getLastModifiedText(book.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
