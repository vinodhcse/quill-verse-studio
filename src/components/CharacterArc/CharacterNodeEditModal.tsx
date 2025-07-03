
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { CanvasNode } from '@/types/plotCanvas';

interface CharacterNodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: CanvasNode) => void;
  node: CanvasNode | null;
}

export const CharacterNodeEditModal: React.FC<CharacterNodeEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  node
}) => {
  const [formData, setFormData] = useState({
    name: '',
    detail: '',
    goal: '',
    aliases: [] as string[],
    traits: [] as string[],
    beliefs: [] as string[],
    motivations: [] as string[],
    internalConflicts: [] as string[],
    externalConflicts: [] as string[]
  });

  const [newInputs, setNewInputs] = useState({
    alias: '',
    trait: '',
    belief: '',
    motivation: '',
    internalConflict: '',
    externalConflict: ''
  });

  useEffect(() => {
    if (node && isOpen) {
      setFormData({
        name: node.name || '',
        detail: node.detail || '',
        goal: node.goal || '',
        aliases: node.aliases || [],
        traits: node.traits || [],
        beliefs: node.beliefs || [],
        motivations: node.motivations || [],
        internalConflicts: node.internalConflicts || [],
        externalConflicts: node.externalConflicts || []
      });
    }
  }, [node, isOpen]);

  const handleSave = () => {
    if (!node) return;

    const updatedNode: CanvasNode = {
      ...node,
      name: formData.name,
      detail: formData.detail,
      goal: formData.goal,
      aliases: formData.aliases,
      traits: formData.traits,
      beliefs: formData.beliefs,
      motivations: formData.motivations,
      internalConflicts: formData.internalConflicts,
      externalConflicts: formData.externalConflicts,
      attributes: [
        { id: 'aliases', name: 'Aliases', value: formData.aliases.join(', ') },
        { id: 'traits', name: 'Traits', value: formData.traits.join(', ') },
        { id: 'beliefs', name: 'Beliefs', value: formData.beliefs.join(', ') },
        { id: 'motivations', name: 'Motivations', value: formData.motivations.join(', ') },
        { id: 'internalConflicts', name: 'Internal Conflicts', value: formData.internalConflicts.join(', ') },
        { id: 'externalConflicts', name: 'External Conflicts', value: formData.externalConflicts.join(', ') }
      ]
    };

    onSave(updatedNode);
    onClose();
  };

  const addItem = (field: keyof typeof newInputs, targetArray: keyof typeof formData) => {
    const value = newInputs[field].trim();
    if (value) {
      setFormData(prev => ({
        ...prev,
        [targetArray]: [...(prev[targetArray] as string[]), value]
      }));
      setNewInputs(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeItem = (targetArray: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [targetArray]: (prev[targetArray] as string[]).filter((_, i) => i !== index)
    }));
  };

  const renderArrayField = (
    label: string,
    arrayKey: keyof typeof formData,
    inputKey: keyof typeof newInputs
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={newInputs[inputKey]}
          onChange={(e) => setNewInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
          placeholder={`Add ${label.toLowerCase()}...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem(inputKey, arrayKey);
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => addItem(inputKey, arrayKey)}
          disabled={!newInputs[inputKey].trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(formData[arrayKey] as string[]).map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {item}
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeItem(arrayKey, index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Character Node</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Character name..."
            />
          </div>

          <div>
            <Label htmlFor="detail">Detail</Label>
            <Textarea
              id="detail"
              value={formData.detail}
              onChange={(e) => setFormData(prev => ({ ...prev, detail: e.target.value }))}
              placeholder="Character description..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="goal">Goal</Label>
            <Input
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="Character goal..."
            />
          </div>

          {renderArrayField('Aliases', 'aliases', 'alias')}
          {renderArrayField('Traits', 'traits', 'trait')}
          {renderArrayField('Beliefs', 'beliefs', 'belief')}
          {renderArrayField('Motivations', 'motivations', 'motivation')}
          {renderArrayField('Internal Conflicts', 'internalConflicts', 'internalConflict')}
          {renderArrayField('External Conflicts', 'externalConflicts', 'externalConflict')}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
