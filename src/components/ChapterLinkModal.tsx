import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Search, Link, AlertCircle } from 'lucide-react';
import { CanvasNode } from '@/types/plotCanvas';
import { apiClient } from '@/lib/api';

interface ChapterLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (linkedNodeId: string | null) => void;
  bookId?: string;
  versionId?: string;
  currentLinkedNodeId?: string | null;
  chapterTitle: string;
}

export const ChapterLinkModal: React.FC<ChapterLinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bookId,
  versionId,
  currentLinkedNodeId,
  chapterTitle
}) => {
  const [plotCanvasNodes, setPlotCanvasNodes] = useState<CanvasNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPlotNodes, setSearchPlotNodes] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(currentLinkedNodeId || null);
  const [showPlotNodeSearch, setShowPlotNodeSearch] = useState(false);

  // Fetch PlotCanvas nodes when modal opens
  useEffect(() => {
    if (isOpen && bookId && versionId) {
      fetchPlotCanvasNodes();
    }
  }, [isOpen, bookId, versionId]);

  // Update selected node when currentLinkedNodeId changes
  useEffect(() => {
    setSelectedNodeId(currentLinkedNodeId || null);
  }, [currentLinkedNodeId]);

  const fetchPlotCanvasNodes = async () => {
    if (!bookId || !versionId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/plotCanvas`);
      const nodes = response.data?.nodes || [];
      // Filter for Chapter and Act nodes that can be linked to chapters
      const linkableNodes = nodes.filter((node: CanvasNode) => 
        node.type === 'Chapter'
      );
      setPlotCanvasNodes(linkableNodes);
    } catch (error) {
      console.error('Failed to fetch plot canvas nodes:', error);
      setPlotCanvasNodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave(selectedNodeId);
    onClose();
  };

  const handleRemoveLink = () => {
    setSelectedNodeId(null);
  };

  const selectedNode = plotCanvasNodes.find(node => node.id === selectedNodeId);

  const filteredNodes = plotCanvasNodes.filter(node => 
    node.name.toLowerCase().includes(searchPlotNodes.toLowerCase()) || 
    node.type.toLowerCase().includes(searchPlotNodes.toLowerCase()) ||
    (node.detail && node.detail.toLowerCase().includes(searchPlotNodes.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Chapter to Plot Canvas Node
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Chapter: {chapterTitle}</h4>
            <p className="text-sm text-muted-foreground">
              Link this chapter to a corresponding node in your Plot Canvas to enable AI features 
              that can use plot context, goals, and chapter details for enhanced writing assistance.
            </p>
          </div>

          {/* Current Linked Node Display */}
          {selectedNode && (
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{selectedNode.type}</Badge>
                    <h5 className="font-medium">{selectedNode.name}</h5>
                  </div>
                  {selectedNode.detail && (
                    <p className="text-sm text-muted-foreground mb-2">{selectedNode.detail}</p>
                  )}
                  {selectedNode.goal && (
                    <div className="text-sm">
                      <span className="font-medium">Goal:</span> {selectedNode.goal}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={handleRemoveLink}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Plot Canvas Node Linking */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Link className="h-4 w-4" />
              {selectedNode ? 'Change Linked Plot Canvas Node' : 'Select Plot Canvas Node to Link'}
            </label>
            
            <Popover open={showPlotNodeSearch} onOpenChange={setShowPlotNodeSearch}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Loading Plot Canvas Nodes...' : 'Search Plot Canvas Nodes'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search nodes..." 
                    value={searchPlotNodes} 
                    onValueChange={setSearchPlotNodes} 
                  />
                  <CommandList>
                    <CommandEmpty>
                      {plotCanvasNodes.length === 0 ? (
                        <div className="p-4 text-center">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No Chapter, Act, or Outline nodes found in Plot Canvas</p>
                        </div>
                      ) : (
                        "No nodes found matching your search."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredNodes.map(node => (
                        <CommandItem
                          key={node.id}
                          onSelect={() => {
                            setSelectedNodeId(node.id);
                            setShowPlotNodeSearch(false);
                          }}
                        >
                          <div className="flex items-center space-x-2 w-full">
                            <input
                              type="radio"
                              checked={selectedNodeId === node.id}
                              readOnly
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{node.type}</Badge>
                                <span className="font-medium">{node.name}</span>
                              </div>
                              {node.detail && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {node.detail}
                                </div>
                              )}
                              {node.goal && (
                                <div className="text-xs text-primary mt-1">
                                  Goal: {node.goal}
                                </div>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedNode ? 'Update Link' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};