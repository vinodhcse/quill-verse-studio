import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Book, Calendar, User, FileText, Mail, Plus, Share, Edit, UserPlus, Trash2, Building2, Link as LinkIcon } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { BookDetails as BookDetailsType, User as UserType, Version } from '@/types/collaboration';
import { useForm } from 'react-hook-form';
import { EditBookModal } from '@/components/EditBookModal';
import { CreateVersionModal } from '@/components/CreateVersionModal';
import { useToast } from '@/hooks/use-toast';
import { getLoggedInUserId } from '../lib/authService';
import { useUserContext } from '../lib/UserContextProvider';

interface InviteFormData {
  email: string;
  role: 'Co-Author' | 'Editor' | 'Reviewer';
}

const BookDetails = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookDetails, setBookDetails] = useState<BookDetailsType | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isDeletingCollaborator, setIsDeletingCollaborator] = useState<string | null>(null);
  const [bookUserRole, setBookUserRole] = useState<string | null>(null);

  const { userId: currentUserId } = useUserContext();
  console.log('Current User ID:', currentUserId);

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
        const bookData = bookResponse.data;
        setBookDetails(bookData);
        
        // Transform versions to match the expected Version type
        const transformedVersions = versionsResponse.data.map((version: any) => ({
          ...version,
          name: version.name || version.title || 'Untitled Version',
          type: version.type || 'Manuscript',
          status: version.status || 'Draft'
        }));
        setVersions(transformedVersions);

        // Determine user role
        const loggedInUserId = currentUserId || getLoggedInUserId();
        console.log('Logged In User ID:', loggedInUserId);
        console.log('Book Author ID:', bookData.authorId);

        let userRole = null;
        
        // Check if user is the author first
        if (bookData.authorId === loggedInUserId) {
          userRole = 'AUTHOR';
          console.log('User is the AUTHOR of this book');
        } else {
          // Check if user is a collaborator
          console.log('Book collaborators:', bookData.collaborators);
          const collaborator = bookData.collaborators?.find(
            (collab) => collab.user_id === loggedInUserId
          );
          console.log('Found collaborator:', collaborator);
          userRole = collaborator ? collaborator.collaborator_type : 'VIEWER';
        }
        
        console.log('Final determined role:', userRole);
        setBookUserRole(userRole);
        
      } catch (error) {
        console.error('Failed to fetch book details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId, currentUserId]);

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
        const currentCollaboratorsIds = bookDetails?.collaboratorIds || [];
        const newCollaborator = {
          user_id: existingUser.id,
          user_email: existingUser.email,
          name: existingUser.name,
          collaborator_type: data.role,
          addedBy: currentUserId || "user_001", // This should come from current user context
          addedAt: new Date().toISOString(),
          expiresAt: null
        };

        const updatedCollaborators = [...currentCollaborators, newCollaborator];
        const updatedCollaboratorids = [...currentCollaboratorsIds, existingUser.id];

        await apiClient.patch(`/books/${bookId}`, {
          collaborators: updatedCollaborators,
          collaboratorIds: updatedCollaboratorids
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
  }) => {
    try {
      // Update book details
      const updateData: any = {
        title: bookData.title,
        subtitle: bookData.subtitle,
        language: bookData.language,
        description: bookData.description,
        bookType: bookData.bookType,
        genre: bookData.genre,
        subGenre: bookData.subGenre,
        bookProse: bookData.bookProse,
        synopsis: bookData.synopsis,
        authorName: bookData.authorName,
        publisherName: bookData.publisherName,
        publisherLink: bookData.publisherLink,
        printISBN: bookData.printISBN,
        ebookISBN: bookData.ebookISBN,
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

      // If there's a new publisher logo file, upload it
      if (bookData.publisherLogoFile) {
        const uploadResponse = await apiClient.post(`/books/${bookId}/files`, {
          file: bookData.publisherLogoFile,
          tags: 'publisher-logo',
          description: 'Publisher logo image',
        }, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        updateData.publisherLogo = uploadResponse.data.url;
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

  const handleCreateVersion = async (versionData: { name: string; baseVersionId?: string }) => {
    try {
      const response = await apiClient.post(`/books/${bookId}/versions`, {
        name: versionData.name,
        type: 'Manuscript',
        status: 'Draft',
        lastModifiedBy: bookDetails?.authorname,
        metaData: {
          totalWords: 0,
          totalCharacters: 0,
          tags: ['Draft', 'Book_series_name'],
        },
      });

      const versionsResponse = await apiClient.get(`/books/${bookId}/versions`);
      const transformedVersions = versionsResponse.data.map((version: any) => ({
        ...version,
        name: version.name || version.title || 'Untitled Version',
        type: version.type || 'Manuscript',
        status: version.status || 'Draft'
      }));
      setVersions(transformedVersions);
      setIsCreateVersionOpen(false);
      
      toast({
        title: "Success",
        description: "Version created successfully",
      });
    } catch (error) {
      console.error('Failed to create version:', error);
      toast({
        title: "Error",
        description: "Failed to create version. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenVersion = (versionId: string) => {
    let basePath = '/write';
    if (bookUserRole === 'EDITOR') {
      basePath = '/edit';
    } else if (bookUserRole === 'REVIEWER') {
      basePath = '/review';
    }
    navigate(`${basePath}/book/${bookId}/version/${versionId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'AUTHOR': return 'bg-purple-100 text-purple-800';
      case 'CO_WRITER': return 'bg-blue-100 text-blue-800';
      case 'EDITOR': return 'bg-green-100 text-green-800';
      case 'REVIEWER': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteCollaborator = async (collaboratorId: string) => {
    if (!bookDetails) return;
    
    setIsDeletingCollaborator(collaboratorId);
    try {
      // Filter out the collaborator to be deleted
      const updatedCollaborators = bookDetails.collaborators.filter(
        collaborator => collaborator.user_id !== collaboratorId
      );

      const updatedCollaboratorids = bookDetails?.collaboratorIds?.filter(
         id => id !== collaboratorId
      );

      // Update the book with the new collaborators list
      await apiClient.patch(`/books/${bookId}`, {
        collaborators: updatedCollaborators,
        collaboratorIds: updatedCollaboratorids
      });

      // Update local state
      setBookDetails({
        ...bookDetails,
        collaborators: updatedCollaborators
      });

      toast({
        title: "Success",
        description: "Collaborator removed successfully",
      });
    } catch (error) {
      console.error('Failed to delete collaborator:', error);
      toast({
        title: "Error",
        description: "Failed to remove collaborator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingCollaborator(null);
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
            <p className="text-lg text-muted-foreground mb-4">by {(bookDetails as any).authorName || bookDetails.authorname}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
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

            {/* New Book Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              {(bookDetails as any).bookType && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{(bookDetails as any).bookType}</Badge>
                </div>
              )}
              {(bookDetails as any).genre && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Genre:</span>
                  <Badge variant="outline">{(bookDetails as any).genre}</Badge>
                </div>
              )}
              {(bookDetails as any).subGenre && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Sub-Genre:</span>
                  <Badge variant="outline">{(bookDetails as any).subGenre}</Badge>
                </div>
              )}
              {(bookDetails as any).bookProse && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Prose:</span>
                  <Badge variant="outline">{(bookDetails as any).bookProse}</Badge>
                </div>
              )}
            </div>

            {(bookDetails as any).synopsis && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Synopsis</h3>
                <p className="text-muted-foreground">{(bookDetails as any).synopsis}</p>
              </div>
            )}

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="publisher">Publisher</TabsTrigger>
          </TabsList>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Book Versions</h3>
              <Button 
                onClick={() => setIsCreateVersionOpen(true)} 
                size="sm"
              >
                <Plus size={16} className="mr-2" />
                Create Version
              </Button>
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
                            <span>{version.createdBy || 'Unknown'}</span>
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
                                  <SelectItem value="CO_WRITER">CO_WRITER</SelectItem>
                                  <SelectItem value="EDITOR">EDITOR</SelectItem>
                                  <SelectItem value="REVIEWER">REVIEWER</SelectItem>
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
                <Card key={collaborator.user_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-sm text-muted-foreground">{collaborator.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(collaborator.collaborator_type)}>
                          {collaborator.collaborator_type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCollaborator(collaborator.user_id)}
                          disabled={isDeletingCollaborator === collaborator.user_id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isDeletingCollaborator === collaborator.user_id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </div>
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

          {/* Publisher Tab */}
          <TabsContent value="publisher" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Publisher Details</h3>
            </div>
            
            <Card>
              <CardContent className="p-6">
                {(bookDetails as any).publisherName || (bookDetails as any).publisherLink || (bookDetails as any).printISBN || (bookDetails as any).ebookISBN ? (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      {(bookDetails as any).publisherLogo && (
                        <div className="w-16 h-12 flex-shrink-0">
                          <img
                            src={(bookDetails as any).publisherLogo}
                            alt="Publisher logo"
                            className="w-full h-full object-contain rounded border"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        {(bookDetails as any).publisherName && (
                          <div className="flex items-center space-x-2">
                            <Building2 size={16} className="text-muted-foreground" />
                            <span className="font-medium">{(bookDetails as any).publisherName}</span>
                          </div>
                        )}
                        
                        {(bookDetails as any).publisherLink && (
                          <div className="flex items-center space-x-2">
                            <LinkIcon size={16} className="text-muted-foreground" />
                            <a 
                              href={(bookDetails as any).publisherLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {(bookDetails as any).publisherLink}
                            </a>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(bookDetails as any).printISBN && (
                            <div>
                              <span className="text-sm text-muted-foreground">Print ISBN:</span>
                              <p className="font-mono text-sm">{(bookDetails as any).printISBN}</p>
                            </div>
                          )}
                          
                          {(bookDetails as any).ebookISBN && (
                            <div>
                              <span className="text-sm text-muted-foreground">E-book ISBN:</span>
                              <p className="font-mono text-sm">{(bookDetails as any).ebookISBN}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No publisher details available</p>
                    <p className="text-sm text-muted-foreground mt-1">Use the Edit Book button to add publisher information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <EditBookModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        book={bookDetails}
        onUpdateBook={handleUpdateBook}
      />

      <CreateVersionModal
        isOpen={isCreateVersionOpen}
        onClose={() => setIsCreateVersionOpen(false)}
        onCreateVersion={handleCreateVersion}
        existingVersions={versions}
      />
    </div>
  );
};

export default BookDetails;
