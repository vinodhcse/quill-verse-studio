import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CanvasNode, WorldLocationAttributes, WorldObjectAttributes } from '@/types/plotCanvas';
import { Plus, X } from 'lucide-react';

interface WorldEntityNodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: CanvasNode) => void;
  node: CanvasNode | null;
}

const WorldEntityNodeEditModal: React.FC<WorldEntityNodeEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  node,
}) => {
  const [formData, setFormData] = useState<WorldLocationAttributes | WorldObjectAttributes>({
    id: '',
    name: '',
    description: '',
    image: '',
    customAttributes: {},
    rulesAndBeliefs: [],
    history: [],
  });

  useEffect(() => {
    if (node && isOpen) {
      setFormData({
        id: node.id,
        name: node.name,
        description: node.description || '',
        image: node.image || '',
        customAttributes: node.customAttributes || {},
        rulesAndBeliefs: Array.isArray(node.rulesAndBeliefs) ? node.rulesAndBeliefs : [],
        history: Array.isArray(node.history) ? node.history : [],
      });
    }
  }, [node, isOpen]);

  const handleSave = () => {
    if (!node) return;

    const updatedNode: CanvasNode = {
      ...node,
      name: formData.name,
      description: formData.description,
      image: formData.image,
      customAttributes: formData.customAttributes,
      rulesAndBeliefs: formData.rulesAndBeliefs,
      history: formData.history,
    };

    onSave(updatedNode);
    onClose();
  };

  const renderArrayField = (
    field: keyof WorldLocationAttributes | keyof WorldObjectAttributes,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {(formData[field] as string[]).map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const updatedArray = [...(formData[field] as string[])];
              updatedArray[index] = e.target.value;
              setFormData((prev) => ({ ...prev, [field]: updatedArray }));
            }}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const updatedArray = (formData[field] as string[]).filter((_, i) => i !== index);
              setFormData((prev) => ({ ...prev, [field]: updatedArray }));
            }}
          >
            <X size={14} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const updatedArray = [...(formData[field] as string[]), ''];
          setFormData((prev) => ({ ...prev, [field]: updatedArray }));
        }}
        className="w-full"
      >
        <Plus size={14} className="mr-1" />
        Add {label.slice(0, -1)}
      </Button>
    </div>
  );

  const renderHistoryField = () => (
    <div className="space-y-2">
      <Label>History</Label>
      {formData.history.map((historyItem, index) => (
        <div key={index} className="space-y-2 p-3 border rounded">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Event"
              value={historyItem.event}
              onChange={(e) => {
                const updatedHistory = [...formData.history];
                updatedHistory[index].event = e.target.value;
                setFormData((prev) => ({ ...prev, history: updatedHistory }));
              }}
            />
            <Input
              type="date"
              value={historyItem.date}
              onChange={(e) => {
                const updatedHistory = [...formData.history];
                updatedHistory[index].date = e.target.value;
                setFormData((prev) => ({ ...prev, history: updatedHistory }));
              }}
            />
          </div>
          <Input
            placeholder="Event note (optional)"
            value={historyItem.eventNote || ''}
            onChange={(e) => {
              const updatedHistory = [...formData.history];
              updatedHistory[index].eventNote = e.target.value;
              setFormData((prev) => ({ ...prev, history: updatedHistory }));
            }}
          />
          {formData.history.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const updatedHistory = formData.history.filter((_, i) => i !== index);
                setFormData((prev) => ({ ...prev, history: updatedHistory }));
              }}
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
        onClick={() => {
          const updatedHistory = [...formData.history, { event: '', eventNote: '', date: '' }];
          setFormData((prev) => ({ ...prev, history: updatedHistory }));
        }}
        className="w-full"
      >
        <Plus size={14} className="mr-1" />
        Add History Event
      </Button>
    </div>
  );

  const renderCustomAttributesField = () => (
    <div className="space-y-2">
      <Label>Custom Attributes</Label>
      {Object.entries(formData.customAttributes).map(([key, value], index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={key}
            onChange={(e) => {
              const updatedAttributes = { ...formData.customAttributes };
              const newKey = e.target.value;
              updatedAttributes[newKey] = updatedAttributes[key];
              delete updatedAttributes[key];
              setFormData((prev) => ({ ...prev, customAttributes: updatedAttributes }));
            }}
            placeholder="Attribute Key"
          />
          <Input
            value={value}
            onChange={(e) => {
              const updatedAttributes = { ...formData.customAttributes };
              updatedAttributes[key] = e.target.value;
              setFormData((prev) => ({ ...prev, customAttributes: updatedAttributes }));
            }}
            placeholder="Attribute Value"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const updatedAttributes = { ...formData.customAttributes };
              delete updatedAttributes[key];
              setFormData((prev) => ({ ...prev, customAttributes: updatedAttributes }));
            }}
          >
            <X size={14} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const updatedAttributes = { ...formData.customAttributes, '': '' };
          setFormData((prev) => ({ ...prev, customAttributes: updatedAttributes }));
        }}
        className="w-full"
      >
        <Plus size={14} className="mr-1" />
        Add Attribute
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit World Entity Node: {node?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter name..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="Enter image URL..."
            />
          </div>

          <div>
            {renderCustomAttributesField()}
          </div>

          {renderArrayField('rulesAndBeliefs', 'Rules & Beliefs')}
          {renderHistoryField()}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorldEntityNodeEditModal;
