import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Share, Calendar, User, FileText } from 'lucide-react';
import { CreateVersionModal } from './CreateVersionModal';
import { ShareVersionModal } from './ShareVersionModal';
import { apiClient } from '@/lib/api';

interface Version {
  id: string;
  name: string;
  type: 'Manuscript' | 'Edition';
  status: 'Draft' | 'Final' | 'Published';
  createdAt: string;
  lastModified: string;
  wordCount: number;
  createdBy: string;
}

interface BookVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    id: string;
    title: string;
    authorname: string;
    bookImage?: string;
  };
  userRole: 'author'| 'co-writer'  | 'editor' | 'reviewer';
  onOpenVersion: (bookId: string, versionId: string) => void;
}

export const BookVersionModal: React.FC<BookVersionModalProps> = ({
  isOpen,
  onClose,
  book,
  userRole,
  onOpenVersion,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && book?.id) {
      const fetchVersions = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.get(`/books/${book.id}/versions`);
          setVersions(response.data);
        } catch (error) {
          console.error('Failed to fetch versions:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchVersions();
    }
  }, [isOpen, book?.id]);

  const handleCreateVersion = async (versionData: { name: string; baseVersionId?: string }) => {
    try {
      const response = await apiClient.post(`books/${book.id}/versions`, {
        name: versionData.name,
        lastModifiedBy: book.authorname,
        metaData: {
          totalWords: 0,
          totalCharacters: 0,
          tags: ['Draft', 'Book_series_name'],
        },
      });

      setVersions([...versions, response.data]);
      setIsCreateVersionOpen(false);
    } catch (error) {
      console.error('Failed to create version:', error);
      alert('Failed to create version. Please try again.');
    }
  };

  const handleShare = (versionId: string) => {
    setSelectedVersionId(versionId);
    setIsShareModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Final': return 'bg-blue-100 text-blue-800';
      case 'Published': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenVersion = (bookId, versionId) => {
    onOpenVersion(bookId, versionId );
  };

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="spinner" />
        </div>
      )}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-16 flex-shrink-0">
                {book?.bookImage ? (
                  <img
                    src={book.bookImage}
                    alt={book.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded">
                    <FileText size={20} className="text-primary/60" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{book?.title || 'Unknown Book'}</h2>
                <p className="text-sm text-muted-foreground">by {book?.authorname || 'Unknown Author'}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Versions</h3>
              {userRole === 'author' && (
                <Button
                  onClick={() => setIsCreateVersionOpen(true)}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Create Version</span>
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              {versions.map((version) => (
                <Card 
                  key={version.id} 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{version.name}</h4>
                          <Badge className={getStatusColor(version.status)}>
                            {version.status}
                          </Badge>
                          <Badge variant="outline">
                            {version.type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>Created: {formatDate(version.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>Modified: {formatDate(version.lastModified)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText size={12} />
                            <span>{version?.wordCount?.toLocaleString()} words</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User size={12} />
                            <span>{version.createdBy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(version.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Share size={16} />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVersion(book.id, version.id)
                          }}
                          size="sm"
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateVersionModal
        isOpen={isCreateVersionOpen}
        onClose={() => setIsCreateVersionOpen(false)}
        onCreateVersion={handleCreateVersion}
        existingVersions={versions}
      />

      <ShareVersionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        versionId={selectedVersionId}
        bookTitle={book?.title}
        versionName={versions.find(v => v.id === selectedVersionId)?.name || ''}
      />
    </>
  );
};
