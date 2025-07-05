
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Character } from '@/types/character';
import { Plus, X } from 'lucide-react';

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Omit<Character, 'id'>) => void;
}

export const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    aliases: [''],
    age: 25,
    birthday: '',
    gender: '',
    description: '',
    image: '',
    traits: [''],
    backstory: '',
    beliefs: [''],
    motivations: [''],
    internalConflicts: [''],
    externalConflicts: [''],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const characterData: Omit<Character, 'id'> = {
      ...formData,
      aliases: formData.aliases.filter(alias => alias.trim() !== ''),
      traits: formData.traits.filter(trait => trait.trim() !== ''),
      beliefs: formData.beliefs.filter(belief => belief.trim() !== ''),
      motivations: formData.motivations.filter(motivation => motivation.trim() !== ''),
      internalConflicts: formData.internalConflicts.filter(conflict => conflict.trim() !== ''),
      externalConflicts: formData.externalConflicts.filter(conflict => conflict.trim() !== ''),
      relationships: [],
      goals: [],
      arc: [],
    };

    onSave(characterData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      aliases: [''],
      age: 25,
      birthday: '',
      gender: '',
      description: '',
      image: '',
      traits: [''],
      backstory: '',
      beliefs: [''],
      motivations: [''],
      internalConflicts: [''],
      externalConflicts: [''],
    });
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
          <DialogTitle>Create New Character</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Button type="submit" className="flex-1">Create Character</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
