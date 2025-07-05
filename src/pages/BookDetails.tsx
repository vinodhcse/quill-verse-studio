import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Book, Calendar, User, FileText, Mail, Plus, Edit, UserPlus, Trash2, Building2, Link as LinkIcon, Star, Globe, Palette } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { BookDetails as BookDetailsType, User as UserType, Version } from '@/types/collaboration';
import { useForm } from 'react-hook-form';
import { EditBookModal } from '@/components/EditBookModal';
import { CreateVersionModal } from '@/components/CreateVersionModal';
import { useToast } from '@/hooks/use-toast';
import { getLoggedInUserId } from '../lib/authService';
import { useUserContext } from '../lib/UserContextProvider';
import AppHeader from '@/components/AppHeader';

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
        
        const transformedVersions = versionsResponse.data.map((version: any) => ({
          ...version,
          name: version.name || version.title || 'Untitled Version',
          type: version.type || 'Manuscript',
          status: version.status || 'Draft'
        }));
        setVersions(transformedVersions);

        const loggedInUserId = currentUserId || getLoggedInUserId();
        let userRole = null;
        
        if (bookData.authorId === loggedInUserId) {
          userRole = 'AUTHOR';
        } else {
          const collaborator = bookData.collaborators?.find(
            (collab) => collab.user_id === loggedInUserId
          );
          userRole = collaborator ? collaborator.collaborator_type : 'VIEWER';
        }
        
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
      let existingUser = null;
      try {
        const userResponse = await apiClient.get(`/users/email/${data.email}`);
        existingUser = userResponse.data;
      } catch (error) {
        console.log('User not found, will create placeholder');
      }

      if (existingUser) {
        const currentCollaborators = bookDetails?.collaborators || [];
        const currentCollaboratorsIds = bookDetails?.collaboratorIds || [];
        const newCollaborator = {
          user_id: existingUser.id,
          user_email: existingUser.email,
          name: existingUser.name,
          collaborator_type: data.role,
          addedBy: currentUserId || "user_001",
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
        await apiClient.post(`/books/${bookId}/invite`, {
          email: data.email,
          role: data.role
        });
      }

      form.reset();
      setShowInviteForm(false);
      
      const response = await apiClient.get(`/books/${bookId}`);
      setBookDetails(response.data);
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      alert('Failed to invite collaborator. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateBook = async (bookData: any) => {
    try {
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
      case 'AUTHOR': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'CO_WRITER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'EDITOR': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'REVIEWER': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleDeleteCollaborator = async (collaboratorId: string) => {
    if (!bookDetails) return;
    
    setIsDeletingCollaborator(collaboratorId);
    try {
      const updatedCollaborators = bookDetails.collaborators.filter(
        collaborator => collaborator.user_id !== collaboratorId
      );

      const updatedCollaboratorids = bookDetails?.collaboratorIds?.filter(
         id => id !== collaboratorId
      );

      await apiClient.patch(`/books/${bookId}`, {
        collaborators: updatedCollaborators,
        collaboratorIds: updatedCollaboratorids
      });

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
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading book details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookDetails) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Book not found</h2>
            <Button asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Modern Book Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border shadow-sm mb-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          <div className="relative p-8">
            <div className="flex items-start gap-8">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                <div className="w-48 h-64 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10">
                  {bookDetails.bookImage ? (
                    <img
                      src={bookDetails.bookImage}
                      alt={bookDetails.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Book size={48} className="text-primary/60" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Book Info */}
              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {bookDetails.title}
                    </h1>
                    <Button 
                      onClick={() => setIsEditModalOpen(true)} 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Book
                    </Button>
                  </div>
                  
                  {bookDetails.subtitle && (
                    <p className="text-xl text-muted-foreground">{bookDetails.subtitle}</p>
                  )}
                  
                  <p className="text-lg font-medium text-muted-foreground">
                    by {(bookDetails as any).authorName || bookDetails.authorname}
                  </p>
                </div>

                {/* Book Details Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {(bookDetails as any).bookType && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Type:</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {(bookDetails as any).bookType}
                      </Badge>
                    </div>
                  )}
                  {(bookDetails as any).genre && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Genre:</span>
                      <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-accent/20">
                        {(bookDetails as any).genre}
                      </Badge>
                    </div>
                  )}
                  {(bookDetails as any).subGenre && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Sub-Genre:</span>
                      <Badge variant="outline" className="border-muted-foreground/30">
                        {(bookDetails as any).subGenre}
                      </Badge>
                    </div>
                  )}
                  {(bookDetails as any).bookProse && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Prose:</span>
                      <Badge variant="outline" className="border-muted-foreground/30">
                        {(bookDetails as any).bookProse}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Synopsis */}
                {(bookDetails as any).synopsis && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Synopsis</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {(bookDetails as any).synopsis}
                    </p>
                  </div>
                )}

                {/* Description */}
                {bookDetails.description && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Description</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {bookDetails.description}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-border/50">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar size={16} />
                    <span>Created {formatDate(bookDetails.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <FileText size={16} />
                    <span>{(bookDetails.wordCount || 0).toLocaleString()} words</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User size={16} />
                    <span>{bookDetails.collaborators?.length || 0} collaborators</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <Tabs defaultValue="versions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="versions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Versions
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Collaborators
            </TabsTrigger>
            <TabsTrigger value="publisher" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Publisher
            </TabsTrigger>
          </TabsList>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Book Versions</h3>
              <Button 
                onClick={() => setIsCreateVersionOpen(true)} 
                className="bg-primary hover:bg-primary/90"
              >
                <Plus size={16} className="mr-2" />
                Create Version
              </Button>
            </div>
            
            <div className="grid gap-6">
              {versions?.map((version) => (
                <Card key={version.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-lg">{version.name}</h4>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Manuscript
                          </Badge>
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Draft
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar size={14} />
                            <span>Created {formatDate(version.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <FileText size={14} />
                            <span>{(version.wordCount || 0).toLocaleString()} words</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User size={14} />
                            <span>{version.createdBy || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleOpenVersion(version.id)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-12">
                  <Book size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">No versions found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Collaborators Tab */}
          <TabsContent value="collaborators" className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Collaborators</h3>
              <Button 
                onClick={() => setShowInviteForm(!showInviteForm)} 
                variant={showInviteForm ? "outline" : "default"}
                className={showInviteForm ? "" : "bg-primary hover:bg-primary/90"}
              >
                <UserPlus size={16} className="mr-2" />
                {showInviteForm ? 'Cancel' : 'Invite Collaborator'}
              </Button>
            </div>

            {/* Invite Form */}
            {showInviteForm && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail size={20} />
                    <span>Invite New Collaborator</span>
                  </CardTitle>
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
                        <Button type="submit" disabled={isInviting} className="bg-primary hover:bg-primary/90">
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
            <div className="grid gap-4">
              {bookDetails.collaborators?.map((collaborator) => (
                <Card key={collaborator.user_id} className="hover:shadow-md transition-shadow border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{collaborator.name}</p>
                          <p className="text-sm text-muted-foreground">{collaborator.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getRoleColor(collaborator.collaborator_type)}>
                          {collaborator.collaborator_type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCollaborator(collaborator.user_id)}
                          disabled={isDeletingCollaborator === collaborator.user_id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
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
                <div className="text-center py-12">
                  <UserPlus size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">No collaborators yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Publisher Tab */}
          <TabsContent value="publisher" className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Publisher Details</h3>
            </div>
            
            <Card className="border-border/50">
              <CardContent className="p-8">
                {(bookDetails as any).publisherName || (bookDetails as any).publisherLink || (bookDetails as any).printISBN || (bookDetails as any).ebookISBN ? (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-6">
                      {(bookDetails as any).publisherLogo && (
                        <div className="w-20 h-16 flex-shrink-0">
                          <img
                            src={(bookDetails as any).publisherLogo}
                            alt="Publisher logo"
                            className="w-full h-full object-contain rounded-lg border border-border/50"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-4">
                        {(bookDetails as any).publisherName && (
                          <div className="flex items-center space-x-3">
                            <Building2 size={20} className="text-primary" />
                            <span className="font-semibold text-lg">{(bookDetails as any).publisherName}</span>
                          </div>
                        )}
                        
                        {(bookDetails as any).publisherLink && (
                          <div className="flex items-center space-x-3">
                            <LinkIcon size={16} className="text-muted-foreground" />
                            <a 
                              href={(bookDetails as any).publisherLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 hover:underline transition-colors"
                            >
                              {(bookDetails as any).publisherLink}
                            </a>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          {(bookDetails as any).printISBN && (
                            <div className="space-y-1">
                              <span className="text-sm font-medium text-muted-foreground">Print ISBN:</span>
                              <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded-lg">
                                {(bookDetails as any).printISBN}
                              </p>
                            </div>
                          )}
                          
                          {(bookDetails as any).ebookISBN && (
                            <div className="space-y-1">
                              <span className="text-sm font-medium text-muted-foreground">E-book ISBN:</span>
                              <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded-lg">
                                {(bookDetails as any).ebookISBN}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No publisher details available</p>
                    <p className="text-sm text-muted-foreground">Use the Edit Book button to add publisher information</p>
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
