
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorldObject } from '@/types/world';
import { Plus, X, Upload, AlertTriangle } from 'lucide-react';
import { uploadBookImage } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EditObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (objectId: string, object: Partial<WorldObject>) => void;
  onDelete: (objectId: string) => void;
  object: WorldObject;
  bookId: string;
}

export const EditObjectModal: React.FC<EditObjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  object,
  bookId,
}) => {
  const [formData, setFormData] = useState({
    name: object.name,
    description: object.description,
    image: object.image || '',
    customAttributes: object.customAttributes,
    rulesAndBeliefs: object.rulesAndBeliefs.length > 0 ? object.rulesAndBeliefs : [''],
    history: object.history.length > 0 ? object.history : [{ event: '', eventNote: '', date: '' }],
    arc: object.arc,
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const objectData: Partial<WorldObject> = {
      ...formData,
      rulesAndBeliefs: formData.rulesAndBeliefs.filter(rule => rule.trim() !== ''),
      history: formData.history.filter(h => h.event.trim() !== ''),
    };

    onSave(object.id, objectData);
    onClose();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await uploadBookImage(bookId, file, 'object-image', `Object image for ${formData.name}`);
      setFormData(prev => ({ ...prev, image: uploadResponse.url }));
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Object: {object.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.image} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {formData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={16} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Object Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this object"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">Save Changes</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <AlertTriangle size={16} className="mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Object</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{object.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(object.id);
                      onClose();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Object
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
