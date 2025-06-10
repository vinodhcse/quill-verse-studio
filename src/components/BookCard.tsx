
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Book {
  id: string;
  title: string;
  author: string;
  image?: string;
  lastModified: string;
  wordCount: number;
}

interface BookCardProps {
  book: Book;
  onSelect: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const formatWordCount = (count: number) => {
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
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
          {book.image ? (
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Book size={48} className="text-primary/60" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {formatWordCount(book.wordCount)} words
            </Badge>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">by {book.author}</p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{getLastModifiedText(book.lastModified)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText size={12} />
              <span>{formatWordCount(book.wordCount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
