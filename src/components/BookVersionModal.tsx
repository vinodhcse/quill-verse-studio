
import React, { useState } from 'react';
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
    author: string;
    image?: string;
  };
  userRole: 'author' | 'editor' | 'reviewer';
  onOpenVersion: (bookId: string, versionId: string) => void;
}

export const BookVersionModal: React.FC<BookVersionModalProps> = ({
  isOpen,
  onClose,
  book,
  userRole,
  onOpenVersion,
}) => {
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Mock versions data - in real app this would come from backend
  const [versions, setVersions] = useState<Version[]>([
    {
      id: 'v1',
      name: 'Initial Draft',
      type: 'Manuscript',
      status: 'Draft',
      createdAt: '2024-06-01',
      lastModified: '2024-06-08',
      wordCount: 45000,
      createdBy: 'John Doe'
    },
    {
      id: 'v2',
      name: 'Final Draft',
      type: 'Manuscript',
      status: 'Final',
      createdAt: '2024-06-05',
      lastModified: '2024-06-07',
      wordCount: 47000,
      createdBy: 'John Doe'
    },
    {
      id: 'v3',
      name: 'First Edition',
      type: 'Edition',
      status: 'Published',
      createdAt: '2024-06-10',
      lastModified: '2024-06-10',
      wordCount: 47500,
      createdBy: 'John Doe'
    }
  ]);

  const handleCreateVersion = (versionData: { name: string; baseVersionId?: string }) => {
    const baseVersion = versionData.baseVersionId 
      ? versions.find(v => v.id === versionData.baseVersionId)
      : versions[versions.length - 1];

    const newVersion: Version = {
      id: `v${versions.length + 1}`,
      name: versionData.name,
      type: 'Manuscript',
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      wordCount: baseVersion?.wordCount || 0,
      createdBy: 'Current User'
    };

    setVersions([...versions, newVersion]);
    setIsCreateVersionOpen(false);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-16 flex-shrink-0">
                {book.image ? (
                  <img
                    src={book.image}
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
                <h2 className="text-xl font-semibold">{book.title}</h2>
                <p className="text-sm text-muted-foreground">by {book.author}</p>
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
                            <span>{version.wordCount.toLocaleString()} words</span>
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
                          onClick={() => onOpenVersion(book.id, version.id)}
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
        bookTitle={book.title}
        versionName={versions.find(v => v.id === selectedVersionId)?.name || ''}
      />
    </>
  );
};
