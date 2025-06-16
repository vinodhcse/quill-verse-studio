
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Book {
  id: string;
  title: string;
  authorName: string;
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
  const formatWordCount = (count: number | undefined) => {
    if (!count) {
      return '0';
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

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
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg h-48">
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
          <div className="absolute top-1.5 right-1.5">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {formatWordCount(book.wordCount)}
            </Badge>
          </div>
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">by {book.authorName}</p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar size={10} />
              <span className="text-xs">{getLastModifiedText(book.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText size={10} />
              <span className="text-xs">{formatWordCount(book.wordCount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
