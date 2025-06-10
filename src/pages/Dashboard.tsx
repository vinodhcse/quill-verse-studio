import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Book } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { CreateBookModal } from '@/components/CreateBookModal';

interface Book {
  id: string;
  title: string;
  author: string;
  image?: string;
  lastModified: string;
  wordCount: number;
}

const Dashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
  ]);

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
    // Here you would navigate to the writing interface with the selected book
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Library</h1>
          <p className="text-muted-foreground">Select a book to continue writing or create a new one</p>
        </div>

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
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={() => handleBookSelect(book.id)}
            />
          ))}
        </div>

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
