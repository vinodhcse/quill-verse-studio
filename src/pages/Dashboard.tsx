import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Book, Grid3X3, List, PenTool } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { CreateBookModal } from '@/components/CreateBookModal';
import { BookVersionModal } from '@/components/BookVersionModal';
import { useNavigate, Link } from 'react-router-dom';
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
  role: 'author' | 'editor' | 'reviewer';
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('author');
  const booksPerPage = 8;

  const [books, setBooks] = useState<Book[]>([
    {
      id: '1',
      title: 'The Digital Frontier',
      author: 'John Doe',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=400&fit=crop',
      lastModified: '2024-06-08',
      wordCount: 45000,
      role: 'author',
    },
    {
      id: '2',
      title: 'Mountain Adventures',
      author: 'John Doe',
      image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&h=400&fit=crop',
      lastModified: '2024-06-05',
      wordCount: 32000,
      role: 'author',
    },
    {
      id: '3',
      title: 'Code Chronicles',
      author: 'Alex Johnson',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop',
      lastModified: '2024-06-02',
      wordCount: 28000,
      role: 'editor',
    },
    {
      id: '4',
      title: 'Ocean Mysteries',
      author: 'Sarah Wilson',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
      lastModified: '2024-06-01',
      wordCount: 51000,
      role: 'editor',
    },
    {
      id: '5',
      title: 'Space Odyssey',
      author: 'Mike Chen',
      image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=400&fit=crop',
      lastModified: '2024-05-30',
      wordCount: 67000,
      role: 'reviewer',
    },
    {
      id: '6',
      title: 'Desert Tales',
      author: 'Lisa Brown',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=300&h=400&fit=crop',
      lastModified: '2024-05-28',
      wordCount: 39000,
      role: 'author',
    },
    {
      id: '7',
      title: 'City Lights',
      author: 'David Kim',
      image: 'https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?w=300&h=400&fit=crop',
      lastModified: '2024-05-25',
      wordCount: 43000,
      role: 'author',
    },
    {
      id: '8',
      title: 'Forest Whispers',
      author: 'Emma Davis',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=400&fit=crop',
      lastModified: '2024-05-22',
      wordCount: 56000,
      role: 'author',
    },
    {
      id: '9',
      title: 'River Journey',
      author: 'Tom Anderson',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
      lastModified: '2024-05-20',
      wordCount: 34000,
      role: 'author',
    },
  ]);

  const getFilteredBooks = () => {
    return books.filter(book => book.role === activeTab);
  };

  const filteredBooks = getFilteredBooks();
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = filteredBooks.slice(startIndex, endIndex);

  const handleCreateBook = (bookData: { title: string; author: string; image?: string; versionName: string }) => {
    const newBook: Book = {
      id: String(books.length + 1),
      title: bookData.title,
      author: bookData.author,
      image: bookData.image,
      lastModified: new Date().toISOString().split('T')[0],
      wordCount: 0,
      role: 'author',
    };
    setBooks([...books, newBook]);
    setIsCreateModalOpen(false);
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setIsVersionModalOpen(true);
  };

  const handleOpenVersion = (bookId: string, versionId: string) => {
    console.log('Opening book:', bookId, 'version:', versionId);
    navigate('/write', { state: { bookId, versionId } });
    setIsVersionModalOpen(false);
  };

  const BookListItem = ({ book }: { book: Book }) => (
    <Card 
      className="cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group border-0 bg-card/80 backdrop-blur-sm hover-scale"
      onClick={() => handleBookSelect(book)}
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'author': return 'My Books';
      case 'editor': return 'Editing';
      case 'reviewer': return 'Reviewing';
      default: return role;
    }
  };

  const getBookCount = (role: string) => {
    return books.filter(book => book.role === role).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-primary/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '6s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 hover-scale">
              <PenTool className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AuthorStudio</span>
            </Link>
            <Button asChild variant="outline" className="hover-scale">
              <Link to="/login">Sign Out</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-animate bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Library
            </h1>
            <p className="text-muted-foreground">Select a book to continue writing or create a new one</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-card/80 backdrop-blur-sm rounded-lg p-1 border border-border/50">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0 hover-scale"
              >
                <Grid3X3 size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0 hover-scale"
              >
                <List size={16} />
              </Button>
            </div>
            
            <Button onClick={() => setIsCreateModalOpen(true)} className="pulse-glow hover-scale">
              <Plus size={16} className="mr-2" />
              Create New Book
            </Button>
          </div>
        </div>

        {/* Role Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="author" className="flex items-center space-x-2">
              <span>{getRoleDisplayName('author')}</span>
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                {getBookCount('author')}
              </span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <span>{getRoleDisplayName('editor')}</span>
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                {getBookCount('editor')}
              </span>
            </TabsTrigger>
            <TabsTrigger value="reviewer" className="flex items-center space-x-2">
              <span>{getRoleDisplayName('reviewer')}</span>
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                {getBookCount('reviewer')}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Book Card - only show for author tab */}
                {activeTab === 'author' && (
                  <Card 
                    className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur-sm hover-scale"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-80 p-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors pulse-glow">
                        <Plus size={24} className="text-primary" />
                      </div>
                      <h3 className="font-medium text-center mb-2">Create New Book</h3>
                      <p className="text-sm text-muted-foreground text-center">Start your next masterpiece</p>
                    </CardContent>
                  </Card>
                )}

                {/* Existing Books */}
                {currentBooks.map((book) => (
                  <div key={book.id} className="animate-fade-in hover-scale">
                    <BookCard
                      book={book}
                      onSelect={() => handleBookSelect(book)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Create New Book List Item - only show for author tab */}
                {activeTab === 'author' && (
                  <Card 
                    className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur-sm hover-scale animate-fade-in"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <CardContent className="flex items-center space-x-4 p-4">
                      <div className="w-16 h-20 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors pulse-glow">
                        <Plus size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Create New Book</h3>
                        <p className="text-sm text-muted-foreground">Start your next masterpiece</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Existing Books */}
                {currentBooks.map((book) => (
                  <div key={book.id} className="animate-fade-in">
                    <BookListItem book={book} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {currentBooks.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6 pulse-glow">
                  <Book size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  No {getRoleDisplayName(activeTab).toLowerCase()} yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'author' 
                    ? 'Create your first book to get started' 
                    : `You haven't been invited to any books as ${activeTab} yet`
                  }
                </p>
                {activeTab === 'author' && (
                  <Button onClick={() => setIsCreateModalOpen(true)} className="pulse-glow hover-scale">
                    <Plus size={16} className="mr-2" />
                    Create Your First Book
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center animate-fade-in">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover-scale"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer hover-scale"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover-scale"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {books.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6 pulse-glow">
              <Book size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No books yet</h3>
            <p className="text-muted-foreground mb-6">Create your first book to get started</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="pulse-glow hover-scale">
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

      <BookVersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        book={selectedBook || { id: '', title: '', author: '' }}
        userRole={selectedBook?.role || 'author'}
        onOpenVersion={handleOpenVersion}
      />
    </div>
  );
};

export default Dashboard;
