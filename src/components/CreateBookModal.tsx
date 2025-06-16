import React, { useState } from 'react';
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
import { Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBookWithImage: (bookData: { title: string; authorname: string; createdAt: string; file: File }) => void;
  onCreateBook?: (bookData: { title: string; authorname: string; image?: string; versionName: string }) => void; // Updated to match unified Book interface
}

interface FormData {
  title: string;
  author: string;
  image?: string;
  versionName: string;
}

export const CreateBookModal: React.FC<CreateBookModalProps> = ({
  isOpen,
  onClose,
  onCreateBookWithImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      title: '',
      author: '',
      image: '',
      versionName: 'Manuscript',
    },
  });

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

  const removeImage = () => {
    setSelectedImage(null);
    form.setValue('image', '');
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const fileInput = document.getElementById('book-cover-upload') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file) {
        onCreateBookWithImage({
          title: data.title,
          authorname: data.author, // Updated to match unified Book interface
          createdAt: new Date().toISOString(),
          file,
        });
      } else {
        alert('Please upload a book cover image.');
      }

      form.reset();
      setSelectedImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Book</DialogTitle>
        </DialogHeader>

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
              name="author"
              rules={{ required: 'Author name is required' }}
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
              name="versionName"
              rules={{ required: 'Version name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Version Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter version name" {...field} />
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
                  <FormLabel>Book Cover (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <input
                        type="file"
                        id="book-cover-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('book-cover-upload')?.click()}
                      >
                        Upload Cover
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
                {isLoading ? 'Creating...' : 'Create Book'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
