
import React from 'react';
import { Editor } from '@tiptap/react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Bold, Italic, Quote, List, ListOrdered, Heading } from 'lucide-react';

interface TextContextMenuProps {
  editor: Editor | null;
  children: React.ReactNode;
}

export const TextContextMenu: React.FC<TextContextMenuProps> = ({ editor, children }) => {
  if (!editor) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="flex items-center"
        >
          <Bold size={14} className="mr-2" />
          {editor.isActive('bold') ? 'Remove Bold' : 'Make Bold'}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="flex items-center"
        >
          <Italic size={14} className="mr-2" />
          {editor.isActive('italic') ? 'Remove Italic' : 'Make Italic'}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="flex items-center"
        >
          <Heading size={14} className="mr-2" />
          {editor.isActive('heading', { level: 1 }) ? 'Remove Heading 1' : 'Make Heading 1'}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="flex items-center"
        >
          <Heading size={14} className="mr-2" />
          {editor.isActive('heading', { level: 2 }) ? 'Remove Heading 2' : 'Make Heading 2'}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="flex items-center"
        >
          <Heading size={14} className="mr-2" />
          {editor.isActive('heading', { level: 3 }) ? 'Remove Heading 3' : 'Make Heading 3'}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="flex items-center"
        >
          <List size={14} className="mr-2" />
          {editor.isActive('bulletList') ? 'Remove Bullet List' : 'Make Bullet List'}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="flex items-center"
        >
          <ListOrdered size={14} className="mr-2" />
          {editor.isActive('orderedList') ? 'Remove Numbered List' : 'Make Numbered List'}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="flex items-center"
        >
          <Quote size={14} className="mr-2" />
          {editor.isActive('blockquote') ? 'Remove Quote' : 'Make Quote'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
