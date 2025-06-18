
import React from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { TextContextMenu } from './TextContextMenu';

interface EditorContentAreaProps {
  editor: Editor;
}

export const EditorContentArea: React.FC<EditorContentAreaProps> = ({ editor }) => {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto relative">
        <TextContextMenu editor={editor}>
          <EditorContent
            editor={editor}
            className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
          />
        </TextContextMenu>
      </div>
    </div>
  );
};
