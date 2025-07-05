
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Character } from '@/types/character';
import { Plus, X, Upload, AlertTriangle } from 'lucide-react';
import { uploadBookImage } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EditCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterId: string, character: Partial<Character>) => void;
  onDelete: (characterId: string) => void;
  character: Character;
  bookId: string;
}

export const EditCharacterModal: React.FC<EditCharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  character,
  bookId,
}) => {
  const [formData, setFormData] = useState({
    name: character.name,
    aliases: character.aliases.length > 0 ? character.aliases : [''],
    age: character.age,
    birthday: character.birthday,
    gender: character.gender,
    description: character.description,
    image: character.image || '',
    traits: character.traits.length > 0 ? character.traits : [''],
    backstory: character.backstory,
    beliefs: character.beliefs.length > 0 ? character.beliefs : [''],
    motivations: character.motivations.length > 0 ? character.motivations : [''],
    internalConflicts: character.internalConflicts.length > 0 ? character.internalConflicts : [''],
    externalConflicts: character.externalConflicts.length > 0 ? character.externalConflicts : [''],
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const characterData: Partial<Character> = {
      ...formData,
      aliases: formData.aliases.filter(alias => alias.trim() !== ''),
      traits: formData.traits.filter(trait => trait.trim() !== ''),
      beliefs: formData.beliefs.filter(belief => belief.trim() !== ''),
      motivations: formData.motivations.filter(motivation => motivation.trim() !== ''),
      internalConflicts: formData.internalConflicts.filter(conflict => conflict.trim() !== ''),
      externalConflicts: formData.externalConflicts.filter(conflict => conflict.trim() !== ''),
    };

    onSave(character.id, characterData);
    onClose();
  };

  const addArrayItem = (field: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof typeof formData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await uploadBookImage(bookId, file, 'character-image', `Character image for ${formData.name}`);
      setFormData(prev => ({ ...prev, image: uploadResponse.url }));
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  const renderArrayField = (field: keyof typeof formData, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {(formData[field] as string[]).map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateArrayItem(field, index, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          {(formData[field] as string[]).length > 1 && (
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
          <DialogTitle>Edit Character: {character.name}</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Character Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the character"
            />
          </div>

          <div>
            <Label htmlFor="backstory">Backstory</Label>
            <Textarea
              id="backstory"
              value={formData.backstory}
              onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
              placeholder="Character's background and history"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderArrayField('aliases', 'Aliases')}
            {renderArrayField('traits', 'Traits')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderArrayField('beliefs', 'Beliefs')}
            {renderArrayField('motivations', 'Motivations')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderArrayField('internalConflicts', 'Internal Conflicts')}
            {renderArrayField('externalConflicts', 'External Conflicts')}
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
                  <AlertDialogTitle>Delete Character</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{character.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(character.id);
                      onClose();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Character
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
