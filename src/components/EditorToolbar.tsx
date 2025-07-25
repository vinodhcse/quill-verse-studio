
import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline,
  List, 
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { apiClient } from '../lib/api';
import { useBookContext } from '../lib/BookContextProvider';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const { bookId, versionId, selectedChapter } = useBookContext();

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children,
    title 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 p-0 rounded-lg transition-all duration-200",
        isActive && "bg-primary/10 text-primary border border-primary/20"
      )}
    >
      {children}
    </Button>
  );

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  };

  const addImage = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const uploadResponse = await apiClient.post(`/books/${bookId}/versions/${versionId}/chapters/${selectedChapter?.id}/files`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Image uploaded successfully:', uploadResponse?.data);

          if (uploadResponse?.data) {
            const url = uploadResponse?.data?.url;
            editor.chain().focus().setImage({ src: url }).run();
            editor.commands.setContent(editor.getJSON()); // Force re-render by resetting content

            // Focus the editor on the newly added image
            const imageElement = editor.view.dom.querySelector(`img[src='${url}']`) as HTMLImageElement;
            if (imageElement) {
              const position = editor.view.posAtDOM(imageElement, 0); // Correctly calculate position
              editor.chain().setTextSelection(position).focus().run();
            }
          } else {
            console.error('Failed to upload image');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    };

    fileInput.click();
  };

  return (
    <div className="flex items-center flex-wrap gap-1 p-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 rounded-t-xl">
      {/* Undo/Redo */}
      <div className="flex items-center space-x-1 mr-3">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={16} />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-border/50 mx-2" />

      {/* Text Formatting */}
      <div className="flex items-center space-x-1 mr-3">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <Underline size={16} />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-border/50 mx-2" />

      {/* Headings Dropdown */}
      <div className="flex items-center space-x-1 mr-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={editor.isActive('heading') ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg transition-all duration-200",
                editor.isActive('heading') && "bg-primary/10 text-primary border border-primary/20"
              )}
              title="Headings"
            >
              <Heading size={16} className="mr-1" />
              {editor.isActive('heading', { level: 1 }) && 'H1'}
              {editor.isActive('heading', { level: 2 }) && 'H2'}
              {editor.isActive('heading', { level: 3 }) && 'H3'}
              {!editor.isActive('heading') && 'H'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-xl border-border/50">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive('paragraph') ? 'bg-accent' : ''}
            >
              Normal Text
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
            >
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-px h-6 bg-border/50 mx-2" />

      {/* Alignment */}
      <div className="flex items-center space-x-1 mr-3">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={16} />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-border/50 mx-2" />

      {/* Lists and Quotes */}
      <div className="flex items-center space-x-1 mr-3">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-border/50 mx-2" />

      {/* Links and Media */}
      <div className="flex items-center space-x-1">
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <Link size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          title="Add Image"
        >
          <Image size={16} />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-border/50 mx-2" />

      {/* Scene Divider */}
      <div className="flex items-center space-x-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().insertContent({ type: 'sceneDivider' }).run()}
          title="Insert Scene Divider"
        >
          <Minus size={16} />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-border/50 mx-2" />

      {/* Font Family, Size, and Color */}
      <div className="flex items-center space-x-2">
        <select
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="px-2 py-1 bg-muted/50 rounded-lg"
        >
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>
        <select
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          className="px-2 py-1 bg-muted/50 rounded-lg"
        >
          <option value="12px">12px</option>
          <option value="16px">16px</option>
          <option value="20px">20px</option>
        </select>
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="px-2 py-1 bg-muted/50 rounded-lg"
        />
       
      </div>
    </div>
  );
};
