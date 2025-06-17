
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Book, Calendar, User, FileText, Mail, Plus, Share, Edit, UserPlus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { BookDetails as BookDetailsType, User as UserType, Version } from '@/types/collaboration';
import { useForm } from 'react-hook-form';
import { EditBookModal } from '@/components/EditBookModal';

interface InviteFormData {
  email: string;
  role: 'Co-Author' | 'Editor' | 'Reviewer';
}

const BookDetails = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [bookDetails, setBookDetails] = useState<BookDetailsType | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const form = useForm<InviteFormData>({
    defaultValues: {
      email: '',
      role: 'Reviewer',
    },
  });

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId) return;
      
      setIsLoading(true);
      try {
        const [bookResponse, versionsResponse] = await Promise.all([
          apiClient.get(`/books/${bookId}`),
          apiClient.get(`/books/${bookId}/versions`)
        ]);
        setBookDetails(bookResponse.data);
        setVersions(versionsResponse.data);
      } catch (error) {
        console.error('Failed to fetch book details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  const handleInviteCollaborator = async (data: InviteFormData) => {
    setIsInviting(true);
    try {
      // Step 1: Check if email is already registered
      let existingUser = null;
      try {
        const userResponse = await apiClient.get(`/users/email/${data.email}`);
        existingUser = userResponse.data;
        console.log('Found existing user:', existingUser);
      } catch (error) {
        console.log('User not found, will create placeholder');
      }

      if (existingUser) {
        // User exists, add them directly to collaborators
        const currentCollaborators = bookDetails?.collaborators || [];
        const newCollaborator = {
          user_id: existingUser.id,
          collaborator_type: data.role,
          addedBy: "user_001", // This should come from current user context
          addedAt: new Date().toISOString(),
          expiresAt: null
        };

        const updatedCollaborators = [...currentCollaborators, newCollaborator];

        await apiClient.patch(`/books/${bookId}`, {
          collaborators: updatedCollaborators
        });
      } else {
        // User doesn't exist, create placeholder and send invitation
        await apiClient.post(`/books/${bookId}/invite`, {
          email: data.email,
          role: data.role
        });
      }

      form.reset();
      setShowInviteForm(false);
      
      // Refresh book details to show new collaborator
      const response = await apiClient.get(`/books/${bookId}`);
      setBookDetails(response.data);
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      alert('Failed to invite collaborator. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateBook = async (bookData: {
    title: string;
    subtitle: string;
    language: string;
    description: string;
    file?: File;
  }) => {
    try {
      // Update book details
      const updateData: any = {
        title: bookData.title,
        subtitle: bookData.subtitle,
        language: bookData.language,
        description: bookData.description,
      };

      // If there's a new image file, upload it first
      if (bookData.file) {
        const uploadResponse = await apiClient.post(`/books/${bookId}/files`, {
          file: bookData.file,
          tags: 'cover',
          description: 'Book cover image',
        }, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        updateData.bookImage = uploadResponse.data.url;
      }

      await apiClient.patch(`/books/${bookId}`, updateData);
      
      // Refresh book details
      const response = await apiClient.get(`/books/${bookId}`);
      setBookDetails(response.data);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update book:', error);
      alert('Failed to update book. Please try again.');
    }
  };

  const handleOpenVersion = (versionId: string) => {
    navigate(`/write/book/${bookId}/version/${versionId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'author': return 'bg-purple-100 text-purple-800';
      case 'Co-Author': return 'bg-blue-100 text-blue-800';
      case 'Editor': return 'bg-green-100 text-green-800';
      case 'Reviewer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!bookDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <Button onClick={() => setIsEditModalOpen(true)} size="sm">
              <Edit size={16} className="mr-2" />
              Edit Book
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Book Header */}
        <div className="flex items-start space-x-6 mb-8">
          <div className="w-32 h-44 flex-shrink-0">
            {bookDetails.bookImage ? (
              <img
                src={bookDetails.bookImage}
                alt={bookDetails.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-lg">
                <Book size={32} className="text-primary/60" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{bookDetails.title}</h1>
            {bookDetails.subtitle && (
              <p className="text-xl text-muted-foreground mb-2">{bookDetails.subtitle}</p>
            )}
            <p className="text-lg text-muted-foreground mb-4">by {bookDetails.authorname}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-muted-foreground" />
                <span>Created: {formatDate(bookDetails.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-muted-foreground" />
                <span>Modified: {formatDate(bookDetails.lastModified)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText size={16} className="text-muted-foreground" />
                <span>{(bookDetails.wordCount || 0).toLocaleString()} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <User size={16} className="text-muted-foreground" />
                <span>{bookDetails.collaborators?.length || 0} collaborators</span>
              </div>
              {bookDetails.language && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Language:</span>
                  <span>{bookDetails.language}</span>
                </div>
              )}
            </div>

            {bookDetails.description && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{bookDetails.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="versions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
          </TabsList>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Book Versions</h3>
            </div>
            
            <div className="grid gap-4">
              {versions?.map((version) => (
                <Card key={version.id} className="cursor-pointer hover:shadow-md transition-all duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{version.name}</h4>
                          <Badge className="bg-blue-100 text-blue-800">Manuscript</Badge>
                          <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>Created: {formatDate(version.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText size={12} />
                            <span>{(version.wordCount || 0).toLocaleString()} words</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User size={12} />
                            <span>{version.createdBy?.name || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => handleOpenVersion(version.id)}
                          size="sm"
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No versions found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Collaborators Tab */}
          <TabsContent value="collaborators" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Collaborators</h3>
              <Button 
                onClick={() => setShowInviteForm(!showInviteForm)} 
                size="sm"
                variant={showInviteForm ? "outline" : "default"}
              >
                <UserPlus size={16} className="mr-2" />
                {showInviteForm ? 'Cancel' : 'Invite Collaborator'}
              </Button>
            </div>

            {/* Invite Form */}
            {showInviteForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite New Collaborator</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleInviteCollaborator)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        rules={{ 
                          required: 'Email is required',
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: 'Invalid email address'
                          }
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Co-Author">Co-Author</SelectItem>
                                  <SelectItem value="Editor">Editor</SelectItem>
                                  <SelectItem value="Reviewer">Reviewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2">
                        <Button type="submit" disabled={isInviting}>
                          <Mail size={16} className="mr-2" />
                          {isInviting ? 'Inviting...' : 'Send Invitation'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowInviteForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {/* Collaborators List */}
            <div className="grid gap-3">
              {bookDetails.collaborators?.map((collaborator) => (
                <Card key={collaborator.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                        </div>
                      </div>
                      <Badge className={getRoleColor(collaborator.role)}>
                        {collaborator.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No collaborators yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditBookModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        book={bookDetails}
        onUpdateBook={handleUpdateBook}
      />
    </div>
  );
};

export default BookDetails;
