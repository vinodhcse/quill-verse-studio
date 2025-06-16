
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Book {
  id: string;
  title: string;
  authorname: string;
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
      className="cursor-pointer hover:shadow-lg transition-all duration-200 group hover:scale-[1.02] w-full max-w-[140px]"
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg w-full h-32">
          {book.bookImage ? (
            <img
              src={book.bookImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Book size={20} className="text-primary/60" />
            </div>
          )}
        </div>
        
        <div className="p-2">
          <h3 className="font-semibold text-xs mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {book.title}
          </h3>
          <p className="text-[10px] text-muted-foreground mb-2">by {book.authorname}</p>
          
          <div className="text-[10px] text-muted-foreground">
            <span>{getLastModifiedText(book.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
