import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Book, Version, Collaborator } from '@/types/collaboration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, BookOpen, Settings, Share2, Trash2 } from 'lucide-react';
import { CreateVersionModal } from '@/components/CreateVersionModal';
import { EditVersionModal } from '@/components/EditVersionModal';
import { ShareVersionModal } from '@/components/ShareVersionModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/clerk-react';
import { Header } from '@/components/Header';

interface Params {
  bookId: string;
}

const BookDetails: React.FC = () => {
  const { bookId } = useParams<Params>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [createVersionModalOpen, setCreateVersionModalOpen] = useState(false);
  const [editVersionModalOpen, setEditVersionModalOpen] = useState(false);
  const [shareVersionModalOpen, setShareVersionModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Version | null>(null);
  const [sharingVersion, setSharingVersion] = useState<Version | null>(null);
  const [deleteVersionDialogOpen, setDeleteVersionDialogOpen] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const { userId, getToken } = useAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId) return;

      try {
        const bookResponse = await apiClient.get(`/books/${bookId}`);
        setBook(bookResponse.data);

        const versionsResponse = await apiClient.get(`/books/${bookId}/versions`);
        setVersions(versionsResponse.data);

        const collaboratorsResponse = await apiClient.get(`/books/${bookId}/collaborators`);
        setCollaborators(collaboratorsResponse.data);
      } catch (error) {
        console.error('Failed to fetch book details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const token = await getToken({ template: "supabase" });
        const userResponse = await apiClient.get(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(userResponse.data);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };

    fetchUser();
  }, [userId, getToken]);

  const handleCreateVersion = async (versionData: { name: string; description: string }) => {
    if (!bookId) return;

    try {
      const response = await apiClient.post(`/books/${bookId}/versions`, versionData);
      setVersions([...versions, response.data]);
      setCreateVersionModalOpen(false);
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  const handleEditVersion = async (versionId: string, versionData: { name: string; description: string }) => {
    if (!bookId) return;

    try {
      const response = await apiClient.put(`/books/${bookId}/versions/${versionId}`, versionData);
      const updatedVersions = versions.map(version => version.id === versionId ? response.data : version);
      setVersions(updatedVersions);
      setEditVersionModalOpen(false);
      setEditingVersion(null);
    } catch (error) {
      console.error('Failed to edit version:', error);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!bookId) return;

    try {
      await apiClient.delete(`/books/${bookId}/versions/${versionId}`);
      const updatedVersions = versions.filter(version => version.id !== versionId);
      setVersions(updatedVersions);
      setDeleteVersionDialogOpen(false);
      setDeletingVersionId(null);
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  };

  const handleShareVersion = async (versionId: string, shareData: any) => {
    if (!bookId) return;

    try {
      // Assuming the API endpoint for sharing a version is something like this
      await apiClient.post(`/books/${bookId}/versions/${versionId}/share`, shareData);
      setShareVersionModalOpen(false);
      setSharingVersion(null);
      // Optionally, provide user feedback (e.g., a toast notification)
      alert('Version shared successfully!');
    } catch (error) {
      console.error('Failed to share version:', error);
      // Optionally, show an error message to the user
      alert('Failed to share version.');
    }
  };

  const currentUserCollaborator = collaborators.find(c => c.userId === user?.id);
  const canManageVersions = currentUserCollaborator?.role === 'owner' || currentUserCollaborator?.role === 'editor';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Book not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-muted-foreground mb-4">{book.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Author: {book.authorName}</span>
            <span>•</span>
            <span>Created: {new Date(book.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated: {new Date(book.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Versions</h2>
              {canManageVersions && (
                <Button onClick={() => setCreateVersionModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Version
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {versions.map((version) => (
                <Card key={version.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{version.name}</h3>
                          <Badge 
                            variant={version.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {version.status}
                          </Badge>
                          <Badge 
                            variant={version.type === 'main' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {version.type}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{version.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span>Created: {new Date(version.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Updated: {new Date(version.updatedAt).toLocaleDateString()}</span>
                          {version.createdBy && (
                            <>
                              <span>•</span>
                              <span>By: {version.createdBy}</span>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/edit/${book.id}/${version.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/plan/${book.id}/${version.id}`)}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Plan
                          </Button>

                          {canManageVersions && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingVersion(version);
                                  setEditVersionModalOpen(true);
                                }}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Settings
                              </Button>

                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSharingVersion(version);
                                  setShareVersionModalOpen(true);
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                              </Button>

                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setDeletingVersionId(version.id);
                                  setDeleteVersionDialogOpen(true);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {versions.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground mb-4">No versions created yet</div>
                    {canManageVersions && (
                      <Button onClick={() => setCreateVersionModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Version
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Collaborators</h2>
            
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <Card key={collaborator.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{collaborator.userName}</div>
                        <div className="text-sm text-muted-foreground">{collaborator.userEmail}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {collaborator.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {collaborators.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground">No collaborators yet</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateVersionModal
        isOpen={createVersionModalOpen}
        onClose={() => setCreateVersionModalOpen(false)}
        onSave={handleCreateVersion}
      />

      {editingVersion && (
        <EditVersionModal
          isOpen={editVersionModalOpen}
          onClose={() => {
            setEditVersionModalOpen(false);
            setEditingVersion(null);
          }}
          onSave={(data) => handleEditVersion(editingVersion.id, data)}
          version={editingVersion}
        />
      )}

      {sharingVersion && (
        <ShareVersionModal
          isOpen={shareVersionModalOpen}
          onClose={() => {
            setShareVersionModalOpen(false);
            setSharingVersion(null);
          }}
          onSave={(data) => handleShareVersion(sharingVersion.id, data)}
          version={sharingVersion}
        />
      )}

      <AlertDialog open={deleteVersionDialogOpen} onOpenChange={setDeleteVersionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingVersionId) {
                  handleDeleteVersion(deletingVersionId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookDetails;
