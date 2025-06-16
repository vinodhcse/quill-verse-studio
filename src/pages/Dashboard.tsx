
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, BookOpen, Users, Calendar, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Book } from '@/types/collaboration';
import { CreateBookModal } from '@/components/CreateBookModal';
import { EditBookModal } from '@/components/EditBookModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

const Dashboard = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'wordCount'>('recent');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/books');
      
      const booksData = response.data.map((book: any) => ({
        id: book.id,
        title: book.title,
        authorname: book.authorname,
        bookImage: book.bookImage,
        lastModified: book.lastModified || book.createdAt,
        createdAt: book.createdAt,
        wordCount: book.wordCount || 0,
        role: book.role || 'author',
        subtitle: book.subtitle,
        language: book.language,
        description: book.description
      }));
      
      setBooks(booksData);
      setFilteredBooks(booksData);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort books
  useEffect(() => {
    let filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.authorname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'wordCount':
          return (b.wordCount || 0) - (a.wordCount || 0);
        case 'recent':
        default:
          return new Date(b.lastModified || b.createdAt).getTime() - new Date(a.lastModified || a.createdAt).getTime();
      }
    });

    setFilteredBooks(filtered);
  }, [books, searchTerm, sortBy]);

  const handleCreateBook = async (bookData: {
    title: string;
    authorname: string;
    subtitle: string;
    language: string;
    description: string;
    createdAt: string;
  }) => {
    try {
      const response = await apiClient.post('/books', bookData);
      const newBook: Book = {
        ...response.data,
        wordCount: 0
      };
      
      setBooks(prevBooks => [newBook, ...prevBooks]);
      setShowCreateModal(false);
      
      toast({
        title: "Success",
        description: "Book created successfully",
      });
    } catch (error) {
      console.error('Error creating book:', error);
      toast({
        title: "Error",
        description: "Failed to create book",
        variant: "destructive",
      });
    }
  };

  const handleCreateBookWithImage = async (bookData: {
    title: string;
    authorname: string;
    subtitle: string;
    language: string;
    description: string;
    createdAt: string;
    file: File;
  }) => {
    try {
      // First create the book
      const bookResponse = await apiClient.post('/books', {
        title: bookData.title,
        authorname: bookData.authorname,
        subtitle: bookData.subtitle,
        language: bookData.language,
        description: bookData.description,
        createdAt: bookData.createdAt,
      });

      const newBook = bookResponse.data;

      // Then upload the image
      const formData = new FormData();
      formData.append('file', bookData.file);
      formData.append('tags', 'book-cover');
      formData.append('description', 'Book cover image');

      const imageResponse = await apiClient.post(`/books/${newBook.id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update the book with the image URL
      const updatedBookResponse = await apiClient.patch(`/books/${newBook.id}`, {
        bookImage: imageResponse.data.url,
      });

      const finalBook: Book = {
        ...updatedBookResponse.data,
        wordCount: 0
      };

      setBooks(prevBooks => [finalBook, ...prevBooks]);
      setShowCreateModal(false);
      
      toast({
        title: "Success",
        description: "Book created successfully with cover image",
      });
    } catch (error) {
      console.error('Error creating book with image:', error);
      toast({
        title: "Error",
        description: "Failed to create book with image",
        variant: "destructive",
      });
    }
  };

  const handleEditBook = async (bookId: string, bookData: {
    title: string;
    subtitle: string;
    language: string;
    description: string;
    bookImage?: string;
  }) => {
    try {
      const response = await apiClient.patch(`/books/${bookId}`, bookData);
      const updatedBook = response.data;

      setBooks(prevBooks =>
        prevBooks.map(book =>
          book.id === bookId ? { ...book, ...updatedBook } : book
        )
      );
      setShowEditModal(false);
      setSelectedBook(null);
      
      toast({
        title: "Success",
        description: "Book updated successfully",
      });
    } catch (error) {
      console.error('Error updating book:', error);
      toast({
        title: "Error",
        description: "Failed to update book",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await apiClient.delete(`/books/${bookId}`);
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
      
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const openBook = (bookId: string) => {
    navigate(`/book/${bookId}`);
  };

  const openEditor = (bookId: string) => {
    navigate(`/write/book/${bookId}/version/default`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
              <p className="text-gray-600 mt-1">Manage your writing projects</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Book
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Sort by: {sortBy === 'recent' ? 'Recent' : sortBy === 'title' ? 'Title' : 'Word Count'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('recent')}>Recent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>Title</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('wordCount')}>Word Count</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {books.length === 0 ? 'No books yet' : 'No books found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {books.length === 0 
                ? 'Start your writing journey by creating your first book'
                : 'Try adjusting your search terms'
              }
            </p>
            {books.length === 0 && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Book
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <div className="relative">
                  {book.bookImage ? (
                    <img
                      src={book.bookImage}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => openEditor(book.id)}>
                          Open Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openBook(book.id)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedBook(book);
                          setShowEditModal(true);
                        }}>
                          Edit Book
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                  {book.subtitle && (
                    <CardDescription className="text-sm text-gray-600 line-clamp-1">
                      {book.subtitle}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>by {book.authorname}</span>
                    <Badge variant="outline" className="text-xs">
                      {book.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {book.wordCount?.toLocaleString() || 0} words
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(book.lastModified || book.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEditor(book.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Write
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBook(book.id)}
                      className="flex-1"
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBookModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateBookWithImage={handleCreateBookWithImage}
        onCreateBookWithoutImage={handleCreateBook}
      />

      {selectedBook && (
        <EditBookModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBook(null);
          }}
          book={selectedBook}
          onUpdateBook={handleEditBook}
        />
      )}
    </div>
  );
};

export default Dashboard;
