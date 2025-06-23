
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorldObject } from '@/types/world';
import { Plus, X } from 'lucide-react';

interface CreateObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (object: Omit<WorldObject, 'id'>) => void;
}

export const CreateObjectModal: React.FC<CreateObjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    customAttributes: {},
    rulesAndBeliefs: [''],
    history: [{ event: '', eventNote: '', date: '' }],
    arc: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const objectData: Omit<WorldObject, 'id'> = {
      ...formData,
      rulesAndBeliefs: formData.rulesAndBeliefs.filter(rule => rule.trim() !== ''),
      history: formData.history.filter(h => h.event.trim() !== ''),
    };

    onSave(objectData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      customAttributes: {},
      rulesAndBeliefs: [''],
      history: [{ event: '', eventNote: '', date: '' }],
      arc: [],
    });
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
          <DialogTitle>Create New Object</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Button type="submit" className="flex-1">Create Object</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
