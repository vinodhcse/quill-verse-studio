
import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import { useUserContext } from '@/lib/UserContextProvider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ImageIcon, Link as LinkIcon, Bold, Italic, UnderlineIcon, ListOrdered, List, Code, AlignLeft, AlignCenter, AlignRight, AlignJustify, History, MessageSquare, ChevronDown } from 'lucide-react';
import { Chapter } from '@/types/collaboration';

interface EditorRichTextEditorProps {
  content: any;
  onChange: (content: any, charCount: any, wordCount: any) => void;
  blockId: string;
  selectedChapter: Chapter;
  isReadOnly?: boolean;
  showTrackChanges?: boolean;
  onTrackChangesToggle?: (value: boolean) => void;
  showComments?: boolean;
  onCommentsToggle?: (value: boolean) => void;
}

export const EditorRichTextEditor: React.FC<EditorRichTextEditorProps> = ({
  content,
  onChange,
  blockId,
  selectedChapter,
  isReadOnly = false,
  showTrackChanges = false,
  onTrackChangesToggle,
  showComments = false,
  onCommentsToggle,
}) => {
  const { userId } = useUserContext();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkURL, setLinkURL] = useState('');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<{ id: string; userId: string; text: string; timestamp: Date }[]>([]);
  const [isCommentPopoverOpen, setIsCommentPopoverOpen] = useState(false);
  const [isToolbarSticky, setIsToolbarSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect();
        setIsToolbarSticky(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAddComment = () => {
    if (comment.trim() === '') return;

    const newComment = {
      id: `comment_${Date.now()}`,
      userId: userId || 'unknown_user',
      text: comment,
      timestamp: new Date(),
    };

    setComments([...comments, newComment]);
    setComment('');
    setIsCommentPopoverOpen(false);
  };

  const handleKeyDown = useCallback((event: any) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (editor?.isFocused()) {
        setSelectedRange(editor.state.selection);
        setIsLinkModalOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Start writing your story...',
      }),
      CharacterCount,
      Focus,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const charCount = editor.storage.characterCount.characters();
      const wordCount = editor.storage.characterCount.words();
      onChange(json, charCount, wordCount);
    },
    editable: !isReadOnly,
  }, [content, isReadOnly]);

  const handleSetLink = () => {
    if (editor && selectedRange) {
      editor.chain().focus().deleteRange(selectedRange).setLink({ href: linkURL }).run();
    }
    setIsLinkModalOpen(false);
    setLinkURL('');
  };

  const handleUnsetLink = () => {
    if (editor) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
  };

  if (!editor) {
    return (
      <div className="prose prose-sm m-5">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className={cn(
        "sticky top-0 z-10 bg-background border-b",
        isToolbarSticky ? 'shadow-md' : ''
      )}>
        <div className="flex flex-wrap items-center gap-2 p-2">
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isReadOnly}
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isReadOnly}
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={isReadOnly}
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={isReadOnly}
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={isReadOnly}
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={isReadOnly}
            variant={editor.isActive('code') ? 'default' : 'ghost'}
            size="sm"
          >
            <Code className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <AlignLeft className="mr-2 h-4 w-4" />
                Alignment
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Text alignment</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft className="mr-2 h-4 w-4" />
                Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter className="mr-2 h-4 w-4" />
                Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight className="mr-2 h-4 w-4" />
                Right
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                <AlignJustify className="mr-2 h-4 w-4" />
                Justify
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                size="sm"
                disabled={isReadOnly}
                onClick={() => {
                  if (editor?.isFocused()) {
                    setSelectedRange(editor.state.selection);
                  }
                }}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input id="link" placeholder="Enter URL..." value={linkURL} onChange={(e) => setLinkURL(e.target.value)} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setIsLinkModalOpen(false)
                    setLinkURL('')
                  }}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleSetLink}>
                    Set Link
                  </Button>
                </div>
                {editor.isActive('link') && (
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={handleUnsetLink}>
                      Remove Link
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            onClick={() => {
              const url = prompt('Enter the image URL');
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
            disabled={isReadOnly}
            variant="ghost"
            size="sm"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {onTrackChangesToggle && (
            <Button
              type="button"
              onClick={() => onTrackChangesToggle(!showTrackChanges)}
              variant={showTrackChanges ? 'default' : 'ghost'}
              size="sm"
            >
              <History className="h-4 w-4" />
            </Button>
          )}

          <Popover open={isCommentPopoverOpen} onOpenChange={setIsCommentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                }}
                variant={showComments ? 'default' : 'ghost'}
                size="sm"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comment">Add Comment</Label>
                  <Textarea id="comment" placeholder="Enter your comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setIsCommentPopoverOpen(false)
                    setComment('')
                  }}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleAddComment}>
                    Add Comment
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <EditorContent editor={editor} className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl m-5 focus:outline-none" />
    </div>
  )
}
