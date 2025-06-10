
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Users, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface ShareVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  versionId: string | null;
  bookTitle: string;
  versionName: string;
}

interface FormData {
  email: string;
  role: 'editor' | 'reviewer';
}

interface Collaborator {
  id: string;
  email: string;
  role: 'editor' | 'reviewer';
  status: 'pending' | 'accepted';
  invitedAt: string;
}

export const ShareVersionModal: React.FC<ShareVersionModalProps> = ({
  isOpen,
  onClose,
  versionId,
  bookTitle,
  versionName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      email: 'editor@example.com',
      role: 'editor',
      status: 'accepted',
      invitedAt: '2024-06-01'
    },
    {
      id: '2',
      email: 'reviewer@example.com',
      role: 'reviewer',
      status: 'pending',
      invitedAt: '2024-06-05'
    }
  ]);

  const form = useForm<FormData>({
    defaultValues: {
      email: '',
      role: 'reviewer',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const newCollaborator: Collaborator = {
        id: String(collaborators.length + 1),
        email: data.email,
        role: data.role,
        status: 'pending',
        invitedAt: new Date().toISOString().split('T')[0]
      };
      setCollaborators([...collaborators, newCollaborator]);
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
  };

  const generateShareLink = () => {
    const link = `${window.location.origin}/shared/${versionId}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'reviewer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Version: {versionName}</DialogTitle>
          <p className="text-sm text-muted-foreground">{bookTitle}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Share Link</h4>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={`${window.location.origin}/shared/${versionId}`}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={generateShareLink}
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the version based on permissions you set.
            </p>
          </div>

          {/* Invite Collaborators */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Invite Collaborators</h4>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex space-x-2">
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
                      <FormItem className="flex-1">
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
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="reviewer">Reviewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    <Mail size={16} className="mr-1" />
                    Invite
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Current Collaborators */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <Users size={16} />
              <span>Current Collaborators ({collaborators.length})</span>
            </h4>
            
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground">No collaborators yet.</p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">{collaborator.email}</span>
                      <Badge className={getRoleColor(collaborator.role)}>
                        {collaborator.role}
                      </Badge>
                      <Badge className={getStatusColor(collaborator.status)}>
                        {collaborator.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
