
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { BookDetails } from '@/types/collaboration';

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookDetails | null;
  onUpdateBook: (bookData: {
    title: string;
    subtitle: string;
    language: string;
    description: string;
    bookType?: string;
    genre?: string;
    subGenre?: string;
    bookProse?: string;
    synopsis?: string;
    authorName?: string;
    publisherName?: string;
    publisherLink?: string;
    printISBN?: string;
    ebookISBN?: string;
    publisherLogo?: string;
    file?: File;
    publisherLogoFile?: File;
  }) => void;
}

interface FormData {
  title: string;
  subtitle: string;
  language: string;
  description: string;
  bookType: string;
  genre: string;
  subGenre: string;
  bookProse: string;
  synopsis: string;
  authorName: string;
  publisherName: string;
  publisherLink: string;
  printISBN: string;
  ebookISBN: string;
  image?: string;
  publisherLogo?: string;
}

const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Other'
];

const genreOptions = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Romance',
  'Thriller',
  'Horror',
  'Historical Fiction',
  'Biography',
  'Self-Help',
  'Business',
  'Health',
  'Travel'
];

const getSubGenreOptions = (genre: string) => {
  const subGenres: Record<string, string[]> = {
    'Fiction': ['Literary Fiction', 'Contemporary Fiction', 'Historical Fiction', 'Adventure', 'Coming of Age'],
    'Non-Fiction': ['Biography', 'Memoir', 'Self-Help', 'Health', 'Business', 'Travel', 'History'],
    'Science Fiction': ['Space Opera', 'Cyberpunk', 'Dystopian', 'Time Travel', 'Hard SF'],
    'Fantasy': ['Epic Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'High Fantasy', 'Paranormal'],
    'Mystery': ['Cozy Mystery', 'Hard-boiled', 'Police Procedural', 'Detective', 'Noir'],
    'Romance': ['Contemporary Romance', 'Historical Romance', 'Paranormal Romance', 'Romantic Suspense'],
    'Thriller': ['Psychological Thriller', 'Legal Thriller', 'Medical Thriller', 'Political Thriller'],
    'Horror': ['Supernatural Horror', 'Psychological Horror', 'Gothic Horror', 'Slasher']
  };
  return subGenres[genre] || [];
};

const proseOptions = [
  'First Person',
  'Second Person',
  'Third Person Limited',
  'Third Person Omniscient'
];

export const EditBookModal: React.FC<EditBookModalProps> = ({
  isOpen,
  onClose,
  book,
  onUpdateBook,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPublisherLogo, setSelectedPublisherLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customGenre, setCustomGenre] = useState('');
  const [customSubGenre, setCustomSubGenre] = useState('');
  const [customProse, setCustomProse] = useState('');

  const form = useForm<FormData>({
    defaultValues: {
      title: '',
      subtitle: '',
      language: 'English',
      description: '',
      bookType: 'Novel',
      genre: '',
      subGenre: '',
      bookProse: '',
      synopsis: '',
      authorName: '',
      publisherName: '',
      publisherLink: '',
      printISBN: '',
      ebookISBN: '',
      image: '',
      publisherLogo: '',
    },
  });

  useEffect(() => {
    if (book && isOpen) {
      form.setValue('title', book.title || '');
      form.setValue('subtitle', book.subtitle || '');
      form.setValue('language', book.language || 'English');
      form.setValue('description', book.description || '');
      form.setValue('bookType', (book as any).bookType || 'Novel');
      form.setValue('genre', (book as any).genre || '');
      form.setValue('subGenre', (book as any).subGenre || '');
      form.setValue('bookProse', (book as any).bookProse || '');
      form.setValue('synopsis', (book as any).synopsis || '');
      form.setValue('authorName', (book as any).authorName || book.authorname || '');
      form.setValue('publisherName', (book as any).publisherName || '');
      form.setValue('publisherLink', (book as any).publisherLink || '');
      form.setValue('printISBN', (book as any).printISBN || '');
      form.setValue('ebookISBN', (book as any).ebookISBN || '');
      setSelectedImage(book.bookImage || null);
      setSelectedPublisherLogo((book as any).publisherLogo || null);
    }
  }, [book, isOpen, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        form.setValue('image', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublisherLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedPublisherLogo(imageUrl);
        form.setValue('publisherLogo', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    form.setValue('image', '');
  };

  const removePublisherLogo = () => {
    setSelectedPublisherLogo(null);
    form.setValue('publisherLogo', '');
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const fileInput = document.getElementById('edit-book-cover-upload') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      const publisherLogoInput = document.getElementById('publisher-logo-upload') as HTMLInputElement;
      const publisherLogoFile = publisherLogoInput?.files?.[0];

      onUpdateBook({
        title: data.title,
        subtitle: data.subtitle,
        language: data.language,
        description: data.description,
        bookType: data.bookType,
        genre: customGenre || data.genre,
        subGenre: customSubGenre || data.subGenre,
        bookProse: customProse || data.bookProse,
        synopsis: data.synopsis,
        authorName: data.authorName,
        publisherName: data.publisherName,
        publisherLink: data.publisherLink,
        printISBN: data.printISBN,
        ebookISBN: data.ebookISBN,
        file,
        publisherLogoFile,
      });

      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedImage(null);
    setSelectedPublisherLogo(null);
    setCustomGenre('');
    setCustomSubGenre('');
    setCustomProse('');
    onClose();
  };

  const selectedGenre = form.watch('genre');
  const selectedBookType = form.watch('bookType');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Book Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="book-details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book-details">Book Details</TabsTrigger>
            <TabsTrigger value="publisher">Publisher Details</TabsTrigger>
          </TabsList>

          <TabsContent value="book-details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: 'Book title is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your book title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter book subtitle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter author name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bookType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Novel">Novel</SelectItem>
                            <SelectItem value="Screenplay">Screenplay</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select or type custom genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {genreOptions.map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Or enter custom genre"
                            value={customGenre}
                            onChange={(e) => setCustomGenre(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subGenre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Genre</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sub-genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSubGenreOptions(selectedGenre).map((subGenre) => (
                                <SelectItem key={subGenre} value={subGenre}>
                                  {subGenre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Or enter custom sub-genre"
                            value={customSubGenre}
                            onChange={(e) => setCustomSubGenre(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedBookType === 'Novel' && (
                  <FormField
                    control={form.control}
                    name="bookProse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Book Prose</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select prose style" />
                              </SelectTrigger>
                              <SelectContent>
                                {proseOptions.map((prose) => (
                                  <SelectItem key={prose} value={prose}>
                                    {prose}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Or enter custom prose style"
                              value={customProse}
                              onChange={(e) => setCustomProse(e.target.value)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="synopsis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Synopsis</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter book synopsis" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((language) => (
                              <SelectItem key={language} value={language}>
                                {language}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter book description" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormLabel>Book Cover</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {selectedImage && (
                            <div className="relative w-32 h-44">
                              <img
                                src={selectedImage}
                                alt="Book cover preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                onClick={removeImage}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          )}
                          <input
                            type="file"
                            id="edit-book-cover-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('edit-book-cover-upload')?.click()}
                          >
                            <Upload size={16} className="mr-2" />
                            {selectedImage ? 'Change Cover' : 'Upload Cover'}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Book'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="publisher">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="publisherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publisher Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter publisher name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publisherLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publisher Link</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter publisher website URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="printISBN"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Print ISBN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter print ISBN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ebookISBN"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-book ISBN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter e-book ISBN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publisherLogo"
                  render={() => (
                    <FormItem>
                      <FormLabel>Publisher Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {selectedPublisherLogo && (
                            <div className="relative w-32 h-20">
                              <img
                                src={selectedPublisherLogo}
                                alt="Publisher logo preview"
                                className="w-full h-full object-contain rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                onClick={removePublisherLogo}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          )}
                          <input
                            type="file"
                            id="publisher-logo-upload"
                            accept="image/*"
                            onChange={handlePublisherLogoUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('publisher-logo-upload')?.click()}
                          >
                            <Upload size={16} className="mr-2" />
                            {selectedPublisherLogo ? 'Change Logo' : 'Upload Logo'}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Book'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
