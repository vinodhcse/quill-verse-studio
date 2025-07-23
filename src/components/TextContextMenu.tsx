import React, { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote,
  Copy, Scissors, Clipboard,
  RefreshCw, Expand, Minimize, CheckCircle, Settings, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIPopupMenu, AIPopupMenuProps } from '@/ai/utils/AIPopupMenu';
import { menu } from '@tauri-apps/api';


export interface AIMenuProps {
  position: { top: number; left: number };
  visible: boolean;
  disabled: boolean;
  originalSlice: {};
}

interface TextContextMenuProps {
  children: React.ReactNode;
  editor: any;
  onRephraseClick?: (selectedText: string, textBlocks: string[], editor: any, action: string) => void;
  aiPopupMenuState?: AIMenuProps;
  onAcceptAiPopupState?: () => void;
  onRejectAiPopupState?: (originalContent) => void;
  onStopAiPopupState?: () => void;
}

export const TextContextMenu: React.FC<TextContextMenuProps> = ({
  children,
  editor,
  onRephraseClick,
  aiPopupMenuState,
  onAcceptAiPopupState,
  onRejectAiPopupState,
  onStopAiPopupState,
}) => {
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  if (!editor) return;
  console.log('Editor state:', editor.state);
  console.log('AI Popup state on loading the menu:', aiPopupMenuState);
  const { selection } = editor.state;

  let selectedText = selection && selection.from !== selection.to
    ? editor.state.doc.textBetween(selection.from, selection.to, '')?.trim() : null;
  let isSelected = false;
  if (selectedText && selectedText.length > 0) {
    console.log('Selected text:', selectedText);
    isSelected = true;
  }
  console.log('Selection state:', selection);
  console.log('Selection state:', selection, 'selection from:', selection?.from, 'selection to:', selection?.to);
  setIsTextSelected(isSelected);
  console.log('Is text selected:', isSelected);
  if (isSelected && !aiPopupMenuState?.visible) {
    const coords = editor.view.coordsAtPos(selection.from);
    const editorBox = editor.view.dom.getBoundingClientRect();

    const top = coords.top - editorBox.top - (menuRef.current?.offsetHeight ?? 60) -20;
    const left = coords.left - editorBox.left;

    setMenuPosition({ top, left });
  }
}, [editor?.state.selection, aiPopupMenuState?.visible]);

  const getSelectedText = () => {
    const { state } = editor;
    return state.doc.textBetween(state.selection.from, state.selection.to, ' ');
  };

  const extractTextBlocks = (from: number, to: number): string[] => {
    const textBlocks: string[] = [];
    const seenTexts = new Set<string>();

    editor.state.doc.nodesBetween(from, to, (node) => {
      const blockText = node.textContent?.trim();
      if (node.isBlock && blockText && !seenTexts.has(blockText)) {
        seenTexts.add(blockText);
        textBlocks.push(blockText);
      }
    });

    return textBlocks.length > 0 ? textBlocks : getSelectedText().split('\n').filter(l => l.length > 10);
  };

  const handleQuickAction = (action: string) => {
    const { from, to } = editor.state.selection;
    if (from === to || !onRephraseClick) return;

    setIsLoading(action);
    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    const textBlocks = extractTextBlocks(from, to);

    try {
      onRephraseClick(selectedText, textBlocks, editor, action);
    } catch (e) {
      console.error("AI action error:", e);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="relative">
      {children}

      {isTextSelected && !aiPopupMenuState?.visible && (
        <div
          ref={menuRef}
          className="absolute z-50 p-3 rounded-xl bg-background border shadow-xl space-y-2 min-w-[420px] max-w-[600px]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <div className="grid grid-cols-7 gap-2 w-fit">
            <Button size="icon" onClick={() => navigator.clipboard.writeText(getSelectedText())}><Copy size={16} /></Button>
            <Button size="icon" onClick={() => { navigator.clipboard.writeText(getSelectedText()); editor.commands.deleteSelection(); }}><Scissors size={16} /></Button>
            <Button size="icon" onClick={async () => { const text = await navigator.clipboard.readText(); editor.commands.insertContent(text); }}><Clipboard size={16} /></Button>
            <Button size="icon" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Button>
            <Button size="icon" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Button>
            <Button size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline size={16} /></Button>
            <Button size="icon" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></Button>
          </div>

          <div className="flex flex-wrap gap-2 w-fit">
            <Button onClick={() => handleQuickAction('rephrase')} disabled={isLoading === 'rephrase'}>
              {isLoading === 'rephrase' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Rephrase
            </Button>
            <Button onClick={() => handleQuickAction('expand')} disabled={isLoading === 'expand'}>
              {isLoading === 'expand' ? <Loader2 size={14} className="animate-spin" /> : <Expand size={14} />}
              Expand
            </Button>
            <Button onClick={() => handleQuickAction('shorten')} disabled={isLoading === 'shorten'}>
              {isLoading === 'shorten' ? <Loader2 size={14} className="animate-spin" /> : <Minimize size={14} />}
              Shorten
            </Button>
            <Button onClick={() => handleQuickAction('validate')} disabled={isLoading === 'validate'}>
              {isLoading === 'validate' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Validate
            </Button>
            <Button onClick={() => handleQuickAction('settings')}><Settings size={14} /> Settings</Button>
          </div>
        </div>
      )}

      {aiPopupMenuState?.visible && (
        <AIPopupMenu
          visible={aiPopupMenuState.visible}
          position={menuPosition}
          disabled={aiPopupMenuState.disabled}
          onAccept={onAcceptAiPopupState}
          onReject={onRejectAiPopupState}
          onStop={onStopAiPopupState}
          originalSlice={aiPopupMenuState.originalSlice}
        />
      )}
    </div>
  );
};
