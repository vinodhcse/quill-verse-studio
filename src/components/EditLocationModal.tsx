import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorldLocation } from '@/types/world';
import { Plus, X, Upload, AlertTriangle } from 'lucide-react';
import { uploadBookImage } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationId: string, location: Partial<WorldLocation>) => void;
  onDelete: (locationId: string) => void;
  location: WorldLocation;
  bookId: string;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  location,
  bookId,
}) => {
  const [formData, setFormData] = useState({
    name: location.name,
    description: location.description,
    image: location.image || '',
    customAttributes: location.customAttributes,
    rulesAndBeliefs: location.rulesAndBeliefs.length > 0 ? location.rulesAndBeliefs : [''],
    history: location.history.length > 0 ? location.history : [{ event: '', eventNote: '', date: '' }],
    arc: location.arc,
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const locationData: Partial<WorldLocation> = {
      ...formData,
      rulesAndBeliefs: formData.rulesAndBeliefs.filter(rule => rule.trim() !== ''),
      history: formData.history.filter(h => h.event.trim() !== ''),
    };

    onSave(location.id, locationData);
    onClose();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await uploadBookImage(bookId, file, 'location-image', `Location image for ${formData.name}`);
      setFormData(prev => ({ ...prev, image: uploadResponse.url }));
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  const addArrayItem = (field: 'rulesAndBeliefs') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'rulesAndBeliefs', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: 'rulesAndBeliefs', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addHistoryItem = () => {
    setFormData(prev => ({
      ...prev,
      history: [...prev.history, { event: '', eventNote: '', date: '' }]
    }));
  };

  const removeHistoryItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      history: prev.history.filter((_, i) => i !== index)
    }));
  };

  const updateHistoryItem = (index: number, field: 'event' | 'eventNote' | 'date', value: string) => {
    setFormData(prev => ({
      ...prev,
      history: prev.history.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const renderArrayField = (field: 'rulesAndBeliefs', label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {formData[field].map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateArrayItem(field, index, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          {formData[field].length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeArrayItem(field, index)}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addArrayItem(field)}
        className="w-full"
      >
        <Plus size={14} className="mr-1" />
        Add {label.slice(0, -1)}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Location: {location.name}</DialogTitle>
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
            <Label htmlFor="name">Location Name*</Label>
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
              placeholder="Describe this location"
            />
          </div>

          {renderArrayField('rulesAndBeliefs', 'Rules & Beliefs')}

          <div className="space-y-2">
            <Label>History</Label>
            {formData.history.map((historyItem, index) => (
              <div key={index} className="space-y-2 p-3 border rounded">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Event"
                    value={historyItem.event}
                    onChange={(e) => updateHistoryItem(index, 'event', e.target.value)}
                  />
                  <Input
                    type="date"
                    value={historyItem.date}
                    onChange={(e) => updateHistoryItem(index, 'date', e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Event note (optional)"
                  value={historyItem.eventNote}
                  onChange={(e) => updateHistoryItem(index, 'eventNote', e.target.value)}
                />
                {formData.history.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeHistoryItem(index)}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHistoryItem}
              className="w-full"
            >
              <Plus size={14} className="mr-1" />
              Add History Event
            </Button>
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
                  <AlertDialogTitle>Delete Location</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{location.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(location.id);
                      onClose();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Location
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
