
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { CanvasNode, CharacterAttributes } from '@/types/plotCanvas';

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
  const [formData, setFormData] = useState<CharacterAttributes>({
    aliases: [],
    traits: [],
    beliefs: [],
    motivations: [],
    internalConflicts: [],
    externalConflicts: []
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
      // Get attributes from the new structure
      const nodeAttributes = node.attributes as CharacterAttributes;
      if (nodeAttributes && typeof nodeAttributes === 'object' && !Array.isArray(nodeAttributes)) {
        setFormData({
          age: nodeAttributes.age,
          birthday: nodeAttributes.birthday,
          gender: nodeAttributes.gender,
          description: nodeAttributes.description,
          image: nodeAttributes.image,
          backstory: nodeAttributes.backstory,
          aliases: nodeAttributes.aliases || [],
          traits: nodeAttributes.traits || [],
          beliefs: nodeAttributes.beliefs || [],
          motivations: nodeAttributes.motivations || [],
          internalConflicts: nodeAttributes.internalConflicts || [],
          externalConflicts: nodeAttributes.externalConflicts || [],
          relationships: nodeAttributes.relationships || [],
          goals: nodeAttributes.goals || []
        });
      } else {
        // Fallback to legacy structure
        setFormData({
          age: node.age,
          birthday: node.birthday,
          gender: node.gender,
          description: node.description,
          image: node.image,
          backstory: node.backstory,
          aliases: node.aliases || [],
          traits: node.traits || [],
          beliefs: node.beliefs || [],
          motivations: node.motivations || [],
          internalConflicts: node.internalConflicts || [],
          externalConflicts: node.externalConflicts || [],
          relationships: node.relationships || [],
          goals: node.goals || []
        });
      }
    }
  }, [node, isOpen]);

  const generateAttributeChangeSummary = (originalAttributes: CharacterAttributes, newAttributes: CharacterAttributes): string => {
    const changes: string[] = [];
    
    const compareArrays = (original: string[] = [], updated: string[] = [], label: string) => {
      const added = updated.filter(item => !original.includes(item));
      const removed = original.filter(item => !updated.includes(item));
      
      if (added.length > 0) {
        changes.push(`Added ${label.toLowerCase()}: ${added.join(', ')}`);
      }
      if (removed.length > 0) {
        changes.push(`Removed ${label.toLowerCase()}: ${removed.join(', ')}`);
      }
    };

    compareArrays(originalAttributes.aliases, newAttributes.aliases, 'aliases');
    compareArrays(originalAttributes.traits, newAttributes.traits, 'traits');
    compareArrays(originalAttributes.beliefs, newAttributes.beliefs, 'beliefs');
    compareArrays(originalAttributes.motivations, newAttributes.motivations, 'motivations');
    compareArrays(originalAttributes.internalConflicts, newAttributes.internalConflicts, 'internal conflicts');
    compareArrays(originalAttributes.externalConflicts, newAttributes.externalConflicts, 'external conflicts');

    return changes.length > 0 ? changes.join('; ') : 'No attribute changes';
  };

  const handleSave = () => {
    if (!node) return;

    // Get original attributes for comparison
    const originalAttributes = node.attributes as CharacterAttributes;
    const changeSummary = generateAttributeChangeSummary(originalAttributes || {}, formData);

    const updatedNode: CanvasNode = {
      ...node,
      name: node.name, // Keep original name
      detail: changeSummary,
      goal: node.goal || '',
      // Update the new attributes structure
      attributes: formData
    };

    onSave(updatedNode);
    onClose();
  };

  const addItem = (field: keyof typeof newInputs, targetArray: keyof CharacterAttributes) => {
    const value = newInputs[field].trim();
    if (value) {
      setFormData(prev => ({
        ...prev,
        [targetArray]: [...(prev[targetArray] as string[] || []), value]
      }));
      setNewInputs(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeItem = (targetArray: keyof CharacterAttributes, index: number) => {
    setFormData(prev => ({
      ...prev,
      [targetArray]: (prev[targetArray] as string[] || []).filter((_, i) => i !== index)
    }));
  };

  const renderArrayField = (
    label: string,
    arrayKey: keyof CharacterAttributes,
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
        {(formData[arrayKey] as string[] || []).map((item, index) => (
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
          <DialogTitle>Edit Character Node: {node?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                placeholder="Character age..."
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={formData.gender || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                placeholder="Character gender..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Character description..."
            />
          </div>

          <div>
            <Label htmlFor="backstory">Backstory</Label>
            <Textarea
              id="backstory"
              value={formData.backstory || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
              placeholder="Character backstory..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderArrayField('Aliases', 'aliases', 'alias')}
            {renderArrayField('Traits', 'traits', 'trait')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderArrayField('Beliefs', 'beliefs', 'belief')}
            {renderArrayField('Motivations', 'motivations', 'motivation')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderArrayField('Internal Conflicts', 'internalConflicts', 'internalConflict')}
            {renderArrayField('External Conflicts', 'externalConflicts', 'externalConflict')}
          </div>

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
