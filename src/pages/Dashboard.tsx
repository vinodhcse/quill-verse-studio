import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Book, Grid3X3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { CreateBookModal } from '@/components/CreateBookModal';
import { useNavigate } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Book {
  id: string;
  title: string;
  author: string;
  image?: string;
  lastModified: string;
  wordCount: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 8;

  const [books, setBooks] = useState<Book[]>([
    {
      id: '1',
      title: 'The Digital Frontier',
      author: 'John Doe',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=400&fit=crop',
      lastModified: '2024-06-08',
      wordCount: 45000,
    },
    {
      id: '2',
      title: 'Mountain Adventures',
      author: 'Jane Smith',
      image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&h=400&fit=crop',
      lastModified: '2024-06-05',
      wordCount: 32000,
    },
    {
      id: '3',
      title: 'Code Chronicles',
      author: 'Alex Johnson',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop',
      lastModified: '2024-06-02',
      wordCount: 28000,
    },
    // Add more sample books for pagination demo
    {
      id: '4',
      title: 'Ocean Mysteries',
      author: 'Sarah Wilson',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
      lastModified: '2024-06-01',
      wordCount: 51000,
    },
    {
      id: '5',
      title: 'Space Odyssey',
      author: 'Mike Chen',
      image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=400&fit=crop',
      lastModified: '2024-05-30',
      wordCount: 67000,
    },
    {
      id: '6',
      title: 'Desert Tales',
      author: 'Lisa Brown',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=300&h=400&fit=crop',
      lastModified: '2024-05-28',
      wordCount: 39000,
    },
    {
      id: '7',
      title: 'City Lights',
      author: 'David Kim',
      image: 'https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?w=300&h=400&fit=crop',
      lastModified: '2024-05-25',
      wordCount: 43000,
    },
    {
      id: '8',
      title: 'Forest Whispers',
      author: 'Emma Davis',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=400&fit=crop',
      lastModified: '2024-05-22',
      wordCount: 56000,
    },
    {
      id: '9',
      title: 'River Journey',
      author: 'Tom Anderson',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
      lastModified: '2024-05-20',
      wordCount: 34000,
    },
  ]);

  const totalPages = Math.ceil(books.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = books.slice(startIndex, endIndex);

  const handleCreateBook = (bookData: { title: string; author: string; image?: string }) => {
    const newBook: Book = {
      id: String(books.length + 1),
      title: bookData.title,
      author: bookData.author,
      image: bookData.image,
      lastModified: new Date().toISOString().split('T')[0],
      wordCount: 0,
    };
    setBooks([...books, newBook]);
    setIsCreateModalOpen(false);
  };

  const handleBookSelect = (bookId: string) => {
    console.log('Selected book:', bookId);
    navigate('/write', { state: { bookId } });
  };

  const BookListItem = ({ book }: { book: Book }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 group"
      onClick={() => handleBookSelect(book.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-20 flex-shrink-0">
            {book.image ? (
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded">
                <Book size={24} className="text-primary/60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors truncate">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last modified: {book.lastModified}</span>
              <span>{book.wordCount.toLocaleString()} words</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Library</h1>
            <p className="text-muted-foreground">Select a book to continue writing or create a new one</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List size={16} />
              </Button>
            </div>
            
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create New Book
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Book Card */}
            <Card 
              className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-80 p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus size={24} className="text-primary" />
                </div>
                <h3 className="font-medium text-center mb-2">Create New Book</h3>
                <p className="text-sm text-muted-foreground text-center">Start your next masterpiece</p>
              </CardContent>
            </Card>

            {/* Existing Books */}
            {currentBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={() => handleBookSelect(book.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Create New Book List Item */}
            <Card 
              className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <CardContent className="flex items-center space-x-4 p-4">
                <div className="w-16 h-20 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Create New Book</h3>
                  <p className="text-sm text-muted-foreground">Start your next masterpiece</p>
                </div>
              </CardContent>
            </Card>

            {/* Existing Books */}
            {currentBooks.map((book) => (
              <BookListItem key={book.id} book={book} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {books.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Book size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No books yet</h3>
            <p className="text-muted-foreground mb-6">Create your first book to get started</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create Your First Book
            </Button>
          </div>
        )}
      </div>

      <CreateBookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBook={handleCreateBook}
      />
    </div>
  );
};

export default Dashboard;
