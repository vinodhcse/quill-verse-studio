
import { useCallback, useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { extractChangesFromContent, consolidateTrackChanges } from '@/utils/trackChangesUtils';

interface UseTrackChangesOptions {
  editor: Editor | null;
  onExtractedChangesUpdate?: (changes: any[]) => void;
  onAcceptChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  onChangeClick?: (changeId: string) => void;
}

export const useTrackChanges = ({
  editor,
  onExtractedChangesUpdate,
  onAcceptChange,
  onRejectChange,
  onChangeClick,
}: UseTrackChangesOptions) => {
  const [extractedChanges, setExtractedChanges] = useState<any[]>([]);

  const updateExtractedChanges = useCallback((content: any) => {
    const changes = extractChangesFromContent(content);
    setExtractedChanges(changes);
    
    if (onExtractedChangesUpdate) {
      onExtractedChangesUpdate(changes);
    }
  }, [onExtractedChangesUpdate]);

  const handleAcceptChange = useCallback((changeId: string) => {
    if (editor) {
      editor.commands.acceptChange(changeId);
      const updated = editor.getJSON();
      updateExtractedChanges(updated);
    }
    if (onAcceptChange) {
      onAcceptChange(changeId);
    }
  }, [editor, updateExtractedChanges, onAcceptChange]);

  const handleRejectChange = useCallback((changeId: string) => {
    if (editor) {
      editor.commands.rejectChange(changeId);
      const updated = editor.getJSON();
      updateExtractedChanges(updated);
    }
    if (onRejectChange) {
      onRejectChange(changeId);
    }
  }, [editor, updateExtractedChanges, onRejectChange]);

  const handleChangeClick = useCallback((changeId: string) => {
    if (editor) {
      const { state } = editor;
      state.doc.descendants((node, pos) => {
        if (node.marks) {
          const trackChangeMark = node.marks.find(mark => 
            mark.type.name === 'textStyle' && mark.attrs.changeId === changeId
          );
          if (trackChangeMark) {
            editor.commands.focus();
            editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize });
            
            const element = editor.view.dom.querySelector(`[data-change-id="${changeId}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
          }
        }
      });
    }
    if (onChangeClick) {
      onChangeClick(changeId);
    }
  }, [editor, onChangeClick]);

  return {
    extractedChanges,
    updateExtractedChanges,
    handleAcceptChange,
    handleRejectChange,
    handleChangeClick,
  };
};
