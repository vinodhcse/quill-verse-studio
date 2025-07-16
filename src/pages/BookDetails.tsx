import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Book, Calendar, User, FileText, Mail, Plus, Edit, UserPlus, Trash2, Building2, Link as LinkIcon, Star, Globe, Palette, Sparkles } from 'lucide-react';
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
  const [isDeletingVersion, setIsDeletingVersion] = useState<string | null>(null);
  const [bookUserRole, setBookUserRole] = useState<string | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

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
    setIsCreatingVersion(true);
    try {
      console.log('Creating version with data:', versionData);
      const response = await apiClient.post(`/books/${bookId}/versions`, {
        name: versionData.name,
        type: 'Manuscript',
        status: 'Draft',
        lastModifiedBy: bookDetails?.authorname,
        baseVersionId: versionData.baseVersionId || null,
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
    } finally {
      setIsCreatingVersion(false);
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

  const handleDeleteVersion = async (versionId: string) => {
    if (!bookDetails) return;
    console.log('Deleting version with ID:', versionId, ' bookDetails:', bookDetails);
    setIsDeletingVersion(versionId);
    try {
      const updatedVersions = versions?.filter(
        version => version.id !== versionId
      );

      await apiClient.delete(`/books/${bookId}/versions/${versionId}`);

      toast({
        title: 'Success',
        description: 'Version removed successfully',
      });
      
      console.log('Updated versions:', updatedVersions);
      setVersions(updatedVersions || []);
    } catch (error) {
      console.error('Failed to delete version:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove version. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingVersion(null);
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

  const confirmDeleteVersion = (versionId: string) => {
    const deleteToast = toast({
      title: "Are you sure?",
      description: "This action is irreversible. Once deleted, the version cannot be retrieved.",
      variant: "default",
      style: {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        width: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      },
      action: (
        <div className="flex space-x-4 mt-4">
          <Button
            onClick={() => {
              handleDeleteVersion(versionId);
              deleteToast.dismiss();
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Accept
          </Button>
          <Button
            onClick={() => deleteToast.dismiss()}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      ),
    });
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
        {/* Enhanced Modern Book Header with Framer Motion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30 border border-slate-200/60 shadow-xl backdrop-blur-sm mb-8"
        >
          {/* Animated Background Elements */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"
            animate={{ 
              background: [
                "linear-gradient(45deg, rgb(59 130 246 / 0.05), rgb(147 51 234 / 0.05), rgb(236 72 153 / 0.05))",
                "linear-gradient(90deg, rgb(147 51 234 / 0.05), rgb(236 72 153 / 0.05), rgb(59 130 246 / 0.05))",
                "linear-gradient(135deg, rgb(236 72 153 / 0.05), rgb(59 130 246 / 0.05), rgb(147 51 234 / 0.05))"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                }}
              />
            ))}
          </div>

          <div className="relative p-10">
            <div className="flex items-start gap-10">
              {/* Enhanced Book Cover */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="relative group">
                  <motion.div 
                    className="w-56 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/80 backdrop-blur-sm"
                    whileHover={{ scale: 1.02, rotateY: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {bookDetails.bookImage ? (
                      <motion.img
                        src={bookDetails.bookImage}
                        alt={bookDetails.title}
                        className="w-full h-full object-cover"
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.8 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center backdrop-blur-sm">
                        <motion.div
                          animate={{ rotateY: [0, 360] }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          <Book size={64} className="text-blue-600/70" />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Floating Edit Button */}
                  <motion.div
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      onClick={() => setIsEditModalOpen(true)} 
                      size="sm"
                      className="bg-white/90 hover:bg-white text-slate-700 shadow-lg border border-slate-200/50 backdrop-blur-sm"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Enhanced Book Info */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex-1 space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight"
                      >
                        {bookDetails.title}
                      </motion.h1>
                      
                      {bookDetails.subtitle && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.8 }}
                          className="text-xl text-slate-600 font-medium"
                        >
                          {bookDetails.subtitle}
                        </motion.p>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1 }}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <User size={16} className="text-white" />
                        </div>
                        <p className="text-lg font-semibold text-slate-700">
                          by {(bookDetails as any).authorName || bookDetails.authorname}
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, delay: 0.8, type: "spring", stiffness: 200 }}
                    >
                      <Button 
                        onClick={() => setIsEditModalOpen(true)} 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg border-0"
                        size="lg"
                      >
                        <Edit size={18} className="mr-2" />
                        Edit Book
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Enhanced Details Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="grid grid-cols-2 gap-x-12 gap-y-4"
                >
                  {(bookDetails as any).bookType && (
                    <motion.div 
                      className="flex items-center space-x-4"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <span className="text-sm font-medium text-slate-600 min-w-[80px]">Type:</span>
                      <Badge variant="secondary" className="bg-blue-100/80 text-blue-700 border-blue-200/50 backdrop-blur-sm">
                        <Sparkles size={12} className="mr-1" />
                        {(bookDetails as any).bookType}
                      </Badge>
                    </motion.div>
                  )}
                  {(bookDetails as any).genre && (
                    <motion.div 
                      className="flex items-center space-x-4"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                      <span className="text-sm font-medium text-slate-600 min-w-[80px]">Genre:</span>
                      <Badge variant="secondary" className="bg-purple-100/80 text-purple-700 border-purple-200/50 backdrop-blur-sm">
                        <Star size={12} className="mr-1" />
                        {(bookDetails as any).genre}
                      </Badge>
                    </motion.div>
                  )}
                  {(bookDetails as any).subGenre && (
                    <motion.div 
                      className="flex items-center space-x-4"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500"></div>
                      <span className="text-sm font-medium text-slate-600 min-w-[80px]">Sub-Genre:</span>
                      <Badge variant="outline" className="border-slate-300/50 bg-white/50 backdrop-blur-sm">
                        {(bookDetails as any).subGenre}
                      </Badge>
                    </motion.div>
                  )}
                  {(bookDetails as any).bookProse && (
                    <motion.div 
                      className="flex items-center space-x-4"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                      <span className="text-sm font-medium text-slate-600 min-w-[80px]">Prose:</span>
                      <Badge variant="outline" className="border-slate-300/50 bg-white/50 backdrop-blur-sm">
                        {(bookDetails as any).bookProse}
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>

                {/* Enhanced Synopsis */}
                {(bookDetails as any).synopsis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    className="space-y-3"
                  >
                    <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                      <span>Synopsis</span>
                    </h3>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {(bookDetails as any).synopsis}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Description */}
                {bookDetails.description && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                    className="space-y-3"
                  >
                    <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                      <span>Description</span>
                    </h3>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {bookDetails.description}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.8 }}
                  className="flex items-center gap-8 pt-6 border-t border-slate-200/50"
                >
                  <motion.div 
                    className="flex items-center space-x-3 text-sm text-slate-600 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Calendar size={16} className="text-blue-500" />
                    <span>Created {formatDate(bookDetails.createdAt)}</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center space-x-3 text-sm text-slate-600 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileText size={16} className="text-purple-500" />
                    <span>{(bookDetails.wordCount || 0).toLocaleString()} words</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center space-x-3 text-sm text-slate-600 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <User size={16} className="text-pink-500" />
                    <span>{bookDetails.collaborators?.length || 0} collaborators</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

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
                disabled={isCreatingVersion}
              >
                {isCreatingVersion ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Create Version
                  </>
                )}
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
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteVersion(version.id)}                         
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          {isDeletingVersion === version.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
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
      {/* Loading Spinner Overlay */}
      {isCreatingVersion && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-[9999]">
          <div className="relative inline-block w-12 h-12">
            <span className="absolute inline-block w-full h-full border-4 border-t-primary border-b-secondary rounded-full animate-spin"></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;
