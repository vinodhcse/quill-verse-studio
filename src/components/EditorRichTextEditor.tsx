  import React, { useEffect, useRef, useState } from 'react';
  import { useEditor, EditorContent } from '@tiptap/react';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import CharacterCount from '@tiptap/extension-character-count';
  import Focus from '@tiptap/extension-focus';
  import TextStyle from '@tiptap/extension-text-style';
  import Underline from '@tiptap/extension-underline';
  import TextAlign from '@tiptap/extension-text-align';
  import Link from '@tiptap/extension-link';
  import Image from '@tiptap/extension-image';
  import FontFamily from '@tiptap/extension-font-family';
  import FontSize from '@tiptap/extension-font-size';
  import Color from '@tiptap/extension-color';
  import Highlight from '@tiptap/extension-highlight';
  import { CommentExtension } from '@/extensions/CommentExtension';
  import { TrackChangesExtension } from '@/extensions/TrackChangesExtension';
  import { EditorToolbar } from './EditorToolbar';
  import { EditModeSelector } from './EditModeSelector';
  import { TextContextMenu } from './TextContextMenu';
  import { TrackChangesToggle } from './TrackChangesToggle';
  import { Button } from '@/components/ui/button';
  import { useCollaboration } from '@/hooks/useCollaboration';
  import { useUserContext } from '@/lib/UserContextProvider';
  import { useBookContext } from '@/lib/BookContextProvider';
  import { cn } from '@/lib/utils';
  import './editor-styles.css';
  import './collaboration-styles.css';
  import { Node } from '@tiptap/core';
  import { consolidateTrackChanges, extractChangesFromContent } from '@/utils/trackChangesUtils';
  import { useLocation } from 'react-router-dom';
  import { useClipboard } from '@/hooks/useClipboard';
  import { AIRephraserModal } from '@/components/AIRephraserModal';
  import { set } from 'date-fns';
  import { processAIRequest } from '@/ai/aiTool';
  import { AIPopupMenu } from '@/ai/utils/AIPopupMenu';
  import { on } from 'events';
  import { TextSelection } from 'prosemirror-state';


  interface CollaborativeRichTextEditorProps {
    content: any;
    onChange: (content: any, totalCharacters: any, totalWords: any) => void;
    placeholder?: string;
    className?: string;
    blockId: string;
    selectedChapter: any;
    showTrackChanges?: boolean;
    onTrackChangesToggle?: (show: boolean) => void;
    onExtractedChangesUpdate?: (changes: any[]) => void;
    onAcceptChange?: (changeId: string) => void;
    onRejectChange?: (changeId: string) => void;
    onChangeClick?: (changeId: string) => void;
  }

  const SceneDivider = Node.create({
    name: 'sceneDivider',

    group: 'block',
    content: '',
    parseHTML() {
      return [
        {
          tag: 'hr.scene-divider',
        },
      ];
    },
    renderHTML() {
      return ['hr', { class: 'scene-divider border-t-2 border-dashed border-gray-400 my-4' }];
    },

    addCommands() {
      return {
        insertSceneDivider: () => ({ commands }) => {
          return commands.insertContent({ type: 'sceneDivider' });
        },
      } as any;
    },

    addNodeView() {
      return ({ node, getPos }) => {
        const dom = document.createElement('hr');
        dom.className = 'scene-divider border-t-2 border-dashed border-gray-400 my-4';

        dom.addEventListener('click', () => {
          console.log('Scene divider clicked at position:', getPos());
        });

        return {
          dom,
        };
      };
    },
  });

  export const EditorRichTextEditor: React.FC<CollaborativeRichTextEditorProps> = ({
    content,
    onChange,
    placeholder = 'Start writing your story...',
    className,
    blockId,
    selectedChapter,
    showTrackChanges = false,
    onTrackChangesToggle,
    onExtractedChangesUpdate,
    onAcceptChange,
    onRejectChange,
    onChangeClick,
  }) => {
    const { userId, name: userName } = useUserContext();
    const { state } = useBookContext();
    const location = useLocation();
    
    // Determine if we're in edit mode based on the route
    const isEditMode = location.pathname.includes('/edit');
    
    // Local state for track changes functionality
    const [trackChangesEnabled, setTrackChangesEnabled] = useState(isEditMode);
    const [showChangesEnabled, setShowChangesEnabled] = useState(showTrackChanges);
    
    // AI Rephraser modal state
    const [showRephraserModal, setShowRephraserModal] = useState(false);
    const [selectedTextForRephrasing, setSelectedTextForRephrasing] = useState('');
    const [textBlocksForRephrasing, setTextBlocksForRephrasing] = useState<string[]>([]);
    const [action, setAction] = useState<string>('rephrase');
    const stopController = useRef<AbortController | null>(null);

    const [popupState, setPopupState] = useState({
    visible: false,
    position: { top: 0, left: 0 },
    disabled: true, // Accept/Reject buttons disabled initially
    originalSlice: {},
    
  });
  console.log('Popup state:', popupState);
 const handleAcceptAiPopupState = () => {
  setPopupState(prev => ({ ...prev, visible: false, disabled: true }));

  if (editor) {
    const { to } = editor.state.selection; // Collapse to end of current selection
    const tr = editor.state.tr
      .setSelection(TextSelection.create(editor.state.doc, to)) // collapse cursor
      .setMeta('addToHistory', false);

    editor.view.dispatch(tr);
  }
};

  /*const handleRejectAiPopupState = ( originalContent) => {
    if (editor) {
        const { from, to } = editor.state.selection;
        console.log("Rejecting AI changes, restoring original content:", originalContent);
        console.log("Rejecting Selection from:", from, "to:", to);
      
        let tr = editor.state.tr;
          let transactionStarted = false;
          let currentParagraphStartPos = from;
    
          // Step 1: Start transaction & delete selection
          tr = tr.delete(from, to);
          tr.insert(from, originalContent);
          editor.view.dispatch(tr);
        setPopupState(prev => ({ ...prev, visible: false, disabled: true }));
      }
  }*/

      const handleRejectAiPopupState = () => {
        if (!editor || !popupState.originalSlice) return;

        const { from, to } = editor.state.selection;
        const tr = editor.state.tr.replaceRange(from, to, popupState.originalSlice);

        editor.view.dispatch(tr);
         setPopupState(prev => ({ ...prev, visible: false, disabled: true }));
      };

  const handleStopAiPopupState = () => {
    stopController.current?.abort();
    setPopupState(prev => ({ ...prev, disabled: false })); // Re-enable buttons after stopping
  }
    
    
    const {
      currentUser,
      editMode,
      setEditMode,
      changeLogs,
      comments,
      addChangeLog,
      acceptChange,
      rejectChange,
      addComment,
    } = useCollaboration();

    const [extractedChanges, setExtractedChanges] = useState<any[]>([]);
    const latestContentRef = useRef<any>(null);
    const initialContentLoaded = useRef(false);
    const [aiFeatureLoading, setAiFeatureLoading] = useState(false);
      const [aiStreaming, setAiStreaming] = useState(false);
      const aiRunningRef = useRef(false);
    
    console.log('Editor content type:', typeof content);
    console.log("📄 Editor received content:", content);
    
    const { copyToClipboard, canCopy } = useClipboard();

    // Handle rephraser modal
    const handleRephraseClick = (selectedText: string, textBlocks: string[], editorInstance: any, action: string) => {
    // setSelectedTextForRephrasing(selectedText);
      //setTextBlocksForRephrasing(textBlocks);
      //setAction(action);
      //setShowRephraserModal(true);

      if (action === 'rephrase' && textBlocks?.length >= 3) {
        console.log("Rephrase action triggered with text:", selectedText);
        setSelectedTextForRephrasing(selectedText);
        setTextBlocksForRephrasing(textBlocks);
        setAction(action);
        setShowRephraserModal(true);
      } else {
        handleAIFeature(selectedText, textBlocks, editorInstance, action);
      }

      
    };

    const escapeQuote = (text: string): string => {
      return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
    };

    const extractContextLines = (editor: any, currentSelection: any, lineCount: number, direction: 'before' | 'after'): string => {
    if (!editor) return '';
    
    const { state } = editor;
    const { doc } = state;
    const lines: string[] = [];
    const seenLines = new Set<string>();
    
    if (direction === 'before') {
      // Extract text before the selection
      if (currentSelection.from > 0) {
        const beforeText = doc.textBetween(0, currentSelection.from, '\n');
        const beforeLines = beforeText.split('\n')
          .map(line => line.trim())
          .filter(line => {
            // Filter out empty lines, headings, and very short lines
            return line && 
                  line.length > 10 && 
                  !line.startsWith('#') && 
                  !line.startsWith('"') && 
                  !line.startsWith("'") &&
                  !seenLines.has(line);
          })
          .slice(-lineCount); // Get the last N lines
        
        beforeLines.forEach(line => {
          seenLines.add(line);
          lines.push(line);
        });
      }
    } else {
      // Extract text after the selection
      if (currentSelection.to < doc.content.size) {
        const afterText = doc.textBetween(currentSelection.to, doc.content.size, '\n');
        const afterLines = afterText.split('\n')
          .map(line => line.trim())
          .filter(line => {
            // Filter out empty lines, headings, and very short lines
            return line && 
                  line.length > 10 && 
                  !line.startsWith('#') && 
                  !line.startsWith('"') && 
                  !line.startsWith("'") &&
                  !seenLines.has(line);
          })
          .slice(0, lineCount); // Get the first N lines
        
        afterLines.forEach(line => {
          seenLines.add(line);
          lines.push(line);
        });
      }
    }
    
    return lines.join('\n');
  };


    const handleAIFeature = async (selectedText: string, textBlocks: string[], editorInstance: any, feature: string) => {
        console.log("Feature selected for AI feature:", feature);
        if (aiRunningRef.current) {
          console.info("AI is already processing...");
          return;
        }
        aiRunningRef.current = true;
        //setAiFeatureLoading(true);
        try {
          const seenTexts = new Set<string>();
          const textToRephrase = textBlocks
            .map(block => escapeQuote(block.trim()))
            .filter(text => {
              if (text.length > 0 && !seenTexts.has(text)) {
                seenTexts.add(text);
                return true;
              }
              return false;
            });
    
          const currentSelection = editor?.state?.selection;
          const textBefore = extractContextLines(editor, currentSelection, 10, 'before');
          const textAfter = extractContextLines(editor, currentSelection, 10, 'after');
          const promptContexts = [];
          /*const promptContexts = [
            ...selectedPlotNodes.map(node => ({
              contextType: 'PlotCanvas',
              id: node.id,
              prompt: node.prompt || ''
            })),
            ...selectedCharacters.map(char => ({
              contextType: 'Character',
              id: char.id,
              prompt: char.prompt || ''
            })),
            ...selectedWorldObjects.map(obj => ({
              contextType: 'WorldObject',
              id: obj.id,
              prompt: obj.prompt || ''
            }))
          ];*/
          stopController.current = new AbortController();
          const payload = {
            feature,
            text: textToRephrase,
            textBefore: [textBefore],
            textAfter: [textAfter],
            promptContexts,
            customInstructions : '',
            userId: userId // Pass userId from UserContext
          };
          setPopupState(prev => ({ ...prev, position: {top:top-10, left:left }, visible: true, disabled: true, originalText: textBlocks }));
          //editor changes
    
          const { from, to } = editor.state.selection;
          const originalContent = editor.state.doc.textBetween(from, to, '\n\n');
          const { top, left } = editor.view.coordsAtPos(from);
          const originalSlice = editor.state.doc.slice(from, to);
          setPopupState(prev => ({
            ...prev,
            position: { top: top - 20, left }, // use calculated values
            visible: true,
            disabled: true,
            originalSlice,
          }));
    
          let insertedPos = from;
          let accumulatedText = '';
          let tr = editor.state.tr;
          let transactionStarted = false;
          let currentParagraphStartPos = from;
    
          // Step 1: Start transaction & delete selection
          tr = tr.delete(from, to)
                .setSelection(TextSelection.create(tr.doc, from)); 
          tr.insert(from, editor.schema.nodes.paragraph.create());
          transactionStarted = true;
          editor.view.dispatch(tr);
          
          // Insert first empty paragraph node at the selection start


    
          try {
          
    
            const finalOutputResponse = await processAIRequest(payload, stopController.current.signal, async (data) => {
            console.log("Streaming data:", data);
            //setAiResults(prev => [...prev, data]);
            //handleInlineUpdate(data.rephrasedParagraphContent || data.text || '');
            
            if (data?.done === true) {
              console.log("--------------------------------");
              console.log("AI processing completed.");
              console.log("Final accumulated text:", accumulatedText);
              setPopupState(prev => ({ ...prev, disabled: false }));
              const newTr = editor.state.tr.setSelection(
                TextSelection.create(editor.state.doc, from, insertedPos)
              );
              editor.view.dispatch(newTr);              
              return;
            }
            let currenText: string = data?.rephrasedParagraphContent || data.text || '';
            let addNewParagraphatEnd = false;
            if (currenText.includes("\n")) {
              currenText = currenText.replace(/\n/g, '');
              addNewParagraphatEnd = true;
            }
            if (currenText.length > 0) {
              accumulatedText += data.rephrasedParagraphContent || data.text || '';
              const value = data.rephrasedParagraphContent || data.text || '';
                // Step 3: Append as it streams
                
                editor.view.dispatch(
                  editor.state.tr.insertText(value, insertedPos)
                );
      
                insertedPos += value.length;
            }
            if (addNewParagraphatEnd)  {
              editor.view.dispatch(
                  editor.state.tr.insert(insertedPos+1, editor.schema.nodes.paragraph.create())
                );
                insertedPos += 2; // Move position after the new paragraph
            }
            
          }, (error) => {
            stopController.current = null;
            console.error("AI processing error:", error);
            // Revert if any error occurs
            if (transactionStarted) {
              editor.view.dispatch(
                editor.state.tr
                  .delete(from, from + accumulatedText.length)
                  .insertText(originalContent, from)
              );
            }
    
          });
    
        // Show context menu above the updated text
          const popupPosition = editor.view.coordsAtPos(from);
          /*dispatch({
            type: 'SHOW_CONTEXT_MENU',
            payload: {
              position: popupPosition,
              message: 'Accept, reject, or retry the change?',
              actions: [
                { label: 'Accept', onClick: () => console.log('Accepted') },
                { label: 'Reject', onClick: () => console.log('Rejected') },
                { label: 'Retry', onClick: () => console.log('Retrying') },
              ],
            },
          });*/
          
    
          
    
        
        } catch (error) {
          console.error('Failed to process AI feature:', error);
        } finally {
          console.log('AI feature processing completed');
          aiRunningRef.current = false;
        }
      } catch (error) {
          console.error('Failed to process AI feature:', error);
        } finally {
          console.log('AI feature processing completed');
        } 
    
      }  

    const handleApplyRephrasedText = (fromPos, toPos) => {
      setShowRephraserModal(false);
      console.log("Applying rephrased text from:", fromPos, "to:", toPos);
      const highlightMarkAttrs = {
              color: '#FFFACD', // A light yellow/lemonchiffon for a subtle highlight
              backgroundColor: '#FFFACD', // A light yellow/lemonchiffon for a subtle highlight};
      }
      if (fromPos !== undefined && toPos !== undefined) {
              setTimeout(() => {
                  if (editor && editor.isEditable) {
                      editor
                        .chain()
                        .focus() // Keep focus for good measure
                        .command(({ tr, state, commands }) => { // Use a custom command to access the transaction
                            const { schema } = state;
                            const highlightMarkType = schema.marks.highlight;

                            if (!highlightMarkType) {
                                console.warn('Highlight mark type not found in schema.');
                                return false; // Indicate failure
                            }

                            // Create a mark instance with the exact attributes that were applied
                            const markToRemove = highlightMarkType.create(highlightMarkAttrs);

                            // Iterate over the range and remove the specific mark
                            // Prosemirror's removeMark method applies to the transaction
                            // This is more robust than commands.unsetMark for explicit ranges
                            tr.removeMark(fromPos, toPos, markToRemove);

                            return true; // Indicate success
                        })
                        .run();
                      console.log(`Highlight removed from range: ${fromPos} to ${toPos}`);
                      const consolidatedContent = consolidateTrackChanges(editor.getJSON());
                      console.log('Debounced saving consolidated content:', consolidatedContent);
                      const plainText = editor.getText();
                      const totalCharacters = plainText.length;
                      const totalWords = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
                      
                      // Call the backend save API
                      onChange(consolidatedContent, totalCharacters, totalWords);
                      
                  }
              }, 10000); // 2 minutes = 120 * 1000 milliseconds
      }


    
          
    };

    

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          blockquote: {
            HTMLAttributes: {
              class: 'bg-gray-100 p-4 rounded-md',
            },
          },
        }),
        TextStyle,
        Highlight.configure({
              multicolor: true, // Allows multiple highlight colors
              // Default highlight color if not specified.
              // You can also specify an 'attr' if you want a custom attribute name for the color.
              // But usually, you pass 'color' directly as the attribute in the mark.
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'max-w-full h-auto rounded-lg my-4',
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          alignments: ['left', 'center', 'right'],
          defaultAlignment: 'left',
        }),
        Placeholder.configure({
          placeholder,
          showOnlyWhenEditable: true,
          showOnlyCurrent: false,
        }),
        CharacterCount,
        Focus.configure({
          className: '',
          mode: 'all',
        }),
        CommentExtension,
        TrackChangesExtension.configure({
          userId: userId || '',
          userName: userName || '',
          enabled: trackChangesEnabled,
        }),
        FontFamily.configure({ types: ['textStyle'] }),
        FontSize.configure({ types: ['textStyle'] }),
        Color.configure({ types: ['textStyle'] }),
        SceneDivider,
      ],
      content: { type: 'doc', content: [] },
      onUpdate: ({ editor, transaction }) => {
        if (aiRunningRef.current) {
          console.info("AI is currently processing, skipping update.");
          return;
        }
        const updated = editor.getJSON();
        latestContentRef.current = updated;

        // Extract changes for display
        const changes = extractChangesFromContent(updated);
        setExtractedChanges(changes);
        
        // Pass changes to parent component
        if (onExtractedChangesUpdate) {
          onExtractedChangesUpdate(changes);
        }

        const plainText = editor.getText();
        const totalCharacters = plainText.length;
        const totalWords = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        // Store editor reference in transaction meta for track changes
        transaction.setMeta('editor', editor);
        
        if (editMode !== 'review') {
          // Consolidate track changes before saving
          const consolidatedContent = consolidateTrackChanges(updated);
          console.log('Saving consolidated content:', consolidatedContent);
          onChange(consolidatedContent, totalCharacters, totalWords);
        }
      },
      editable: editMode !== 'review',
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none',
            'min-h-[calc(100vh-16rem)] p-6 text-base leading-relaxed',
            'bg-background rounded-xl',
            editMode === 'review' && 'cursor-default',
            !showChangesEnabled && 'hide-track-changes',
            className
          ),
        },
        handleKeyDown(view, event) {
          // Handle Ctrl+C / Cmd+C
          if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            event.preventDefault();
            const { state } = view;
            const { from, to } = state.selection;
            const selectedText = state.doc.textBetween(from, to);
            
            if (selectedText) {
              copyToClipboard(selectedText).then((success) => {
                if (!success) {
                  console.log('Copy operation was blocked by clipboard control');
                }
              });
            }
            return true;
          }
          
          if (event.key === 'Enter') {
            const { selection } = view.state;
            if (selection.empty && selection.$head.pos === view.state.doc.content.size) {
              event.preventDefault();
              return true;
            }
          }
          return false;
        },
        handleClick(view, pos, event) {
          // Check if clicked on a tracked change
          const { state } = view;
          const resolvedPos = state.doc.resolve(pos);
          
          // Fix: resolvedPos.marks is a function, need to call it
          const marks = resolvedPos.marks();
          if (marks && marks.length > 0) {
            const trackChangeMark = marks.find(mark => 
              mark.type.name === 'textStyle' && mark.attrs.changeId
            );
            
            if (trackChangeMark && trackChangeMark.attrs.changeId) {
              const changeId = trackChangeMark.attrs.changeId;
              console.log('Editor: Clicked on tracked change:', changeId);
              
              // Notify sidebar to highlight this change
              window.dispatchEvent(new CustomEvent('changeFocus', {
                detail: { changeId }
              }));
            }
          }
          
          return false;
        },
        clipboardTextSerializer: () => {
          // Prevent default text serialization
          return '';
        },
      },
    });

    // Listen for sidebar events
    useEffect(() => {
      const handleFocusChange = (event: CustomEvent) => {
        const changeId = event.detail.changeId;
        handleChangeClick(changeId);
      };

      const handleAcceptChangeEvent = (event: CustomEvent) => {
        const changeId = event.detail.changeId;
        handleAcceptChange(changeId);
      };

      const handleRejectChangeEvent = (event: CustomEvent) => {
        const changeId = event.detail.changeId;
        handleRejectChange(changeId);
      };

      window.addEventListener('focusChange', handleFocusChange as EventListener);
      window.addEventListener('acceptChange', handleAcceptChangeEvent as EventListener);
      window.addEventListener('rejectChange', handleRejectChangeEvent as EventListener);

      return () => {
        window.removeEventListener('focusChange', handleFocusChange as EventListener);
        window.removeEventListener('acceptChange', handleAcceptChangeEvent as EventListener);
        window.removeEventListener('rejectChange', handleRejectChangeEvent as EventListener);
      };
    }, [editor]);

    // Handle accept/reject changes
    const handleAcceptChange = (changeId: string) => {
      console.log('EditorRichTextEditor: Accepting change:', changeId);
      if (editor) {
        editor.commands.acceptChange(changeId);
        // Update extracted changes after accepting
        setTimeout(() => {
          const updated = editor.getJSON();
          const changes = extractChangesFromContent(updated);
          setExtractedChanges(changes);
          if (onExtractedChangesUpdate) {
            onExtractedChangesUpdate(changes);
          }
        }, 100);
        
        // Dispatch event to notify sidebar
        window.dispatchEvent(new CustomEvent('changeAccepted', {
          detail: { changeId }
        }));
      }
      if (onAcceptChange) {
        onAcceptChange(changeId);
      }
    };

    const handleRejectChange = (changeId: string) => {
      console.log('EditorRichTextEditor: Rejecting change:', changeId);
      if (editor) {
        editor.commands.rejectChange(changeId);
        // Update extracted changes after rejecting
        setTimeout(() => {
          const updated = editor.getJSON();
          const changes = extractChangesFromContent(updated);
          setExtractedChanges(changes);
          if (onExtractedChangesUpdate) {
            onExtractedChangesUpdate(changes);
          }
        }, 100);
        
        // Dispatch event to notify sidebar
        window.dispatchEvent(new CustomEvent('changeRejected', {
          detail: { changeId }
        }));
      }
      if (onRejectChange) {
        onRejectChange(changeId);
      }
    };

    // Handle clicking on a change to focus it
    const handleChangeClick = (changeId: string) => {
      console.log('EditorRichTextEditor: Focusing change:', changeId);
      if (editor) {
        // Find the change in the document and scroll to it
        const { state } = editor;
        let found = false;
        
        state.doc.descendants((node, pos) => {
          if (!found && node.marks) {
            const trackChangeMark = node.marks.find(mark => 
              mark.type.name === 'textStyle' && mark.attrs.changeId === changeId
            );
            if (trackChangeMark) {
              // Focus the editor and set selection to this position
              editor.commands.focus();
              editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize });
              
              // Add a visual highlight temporarily
              const element = editor.view.dom.querySelector(`[data-change-id="${changeId}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlighted-change');
                setTimeout(() => {
                  element.classList.remove('highlighted-change');
                }, 2000);
              }

              found = true;
              return false; // Stop searching
            }
          }
        });
      }
      if (onChangeClick) {
        onChangeClick(changeId);
      }
    };

    // Load content only once
    useEffect(() => {
      if (!editor || initialContentLoaded.current) return;

      if (content?.type === 'doc') {
        editor.commands.setContent(content);
        latestContentRef.current = content;
        initialContentLoaded.current = true;

         // 🛠️ Fix: Force collapse selection to start to prevent AllSelection
        editor.commands.setTextSelection(0);
        editor.commands.focus(); // optional: ensures visual cursor position reset
        
        // Extract initial changes
        const changes = extractChangesFromContent(content);
        setExtractedChanges(changes);
        if (onExtractedChangesUpdate) {
          onExtractedChangesUpdate(changes);
        }
        
        console.log('Editor content set on load.');
      } else {
        editor.commands.clearContent();
      }
    }, [editor, content]);

    // Update track changes when trackChangesEnabled changes
    useEffect(() => {
      if (editor) {
        editor.commands.toggleTrackChanges(trackChangesEnabled);
      }
    }, [editor, trackChangesEnabled]);

    // Update visibility when showChangesEnabled changes
    useEffect(() => {
      if (editor) {
        // Update CSS classes
        const editorElement = editor.view.dom;
        if (showChangesEnabled) {
          editorElement.classList.remove('hide-track-changes');
        } else {
          editorElement.classList.add('hide-track-changes');
        }
      }
      
      // Also update parent component and control sidebar visibility
      if (onTrackChangesToggle) {
        onTrackChangesToggle(showChangesEnabled);
      }

      // Dispatch event to control sidebar visibility
      window.dispatchEvent(new CustomEvent('toggleSidebarChanges', {
        detail: { showChanges: showChangesEnabled }
      }));
    }, [editor, showChangesEnabled]);

    const handleTrackChangesToggle = (enabled: boolean) => {
      if (isEditMode) {
        // In edit mode, track changes should always be on
        return;
      }
      setTrackChangesEnabled(enabled);
    };

    const handleShowChangesToggle = (show: boolean) => {
      setShowChangesEnabled(show);
    };

    if (!editor) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="relative inline-block w-12 h-12">
            <span className="absolute inline-block w-full h-full border-4 border-t-primary border-b-secondary rounded-full animate-spin"></span>
          </div>
        </div>
      );
    }

    useEffect(() => {
      return () => {
        if (editor) {
          editor.destroy();
          initialContentLoaded.current = false; 
          console.log('Editor destroyed on unmount');
        }
      };
    }, []);

    return (
      <div className="h-full flex flex-col bg-background/50 rounded-2xl border border-border/50 shadow-lg backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80">
          <EditModeSelector 
            currentMode={editMode} 
            onModeChange={setEditMode} 
            currentUser={currentUser}
            trackChangesEnabled={trackChangesEnabled}
            showChangesEnabled={showChangesEnabled}
            onTrackChangesToggle={handleTrackChangesToggle}
            onShowChangesToggle={handleShowChangesToggle}
            isEditMode={isEditMode}
            fileStatus="Auto-saved"
          />
          
          {/* Add clipboard status indicator */}
          {window.__TAURI__ && (
            <div className={`text-xs px-2 py-1 rounded-full ${
              canCopy 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {canCopy ? 'Copy Enabled' : 'Copy Restricted'}
            </div>
          )}

          
        </div>

        <EditorToolbar editor={editor} />

        <div className="flex-1 overflow-hidden">
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto relative">
            <TextContextMenu editor={editor} onRephraseClick={handleRephraseClick} aiPopupMenuState={popupState} onAcceptAiPopupState={handleAcceptAiPopupState} onRejectAiPopupState={handleRejectAiPopupState} onStopAiPopupState={handleStopAiPopupState}>
              <EditorContent
                editor={editor}
                className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
              />
            </TextContextMenu>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 text-xs text-muted-foreground bg-background/50 z-50">
          <div className="flex items-center space-x-4">
            <span className="px-2 py-1 bg-muted/50 rounded-full">
              {editor.storage.characterCount.characters()} characters
            </span>
            <span className="px-2 py-1 bg-muted/50 rounded-full">
              {editor.storage.characterCount.words()} words
            </span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
              {editMode} mode • TipTap
            </span>
          </div>
        </div>

        {/* AI Rephraser Modal */}
        <AIRephraserModal
          isOpen={showRephraserModal}
          onClose={() => setShowRephraserModal(false)}
          selectedText={selectedTextForRephrasing}
          textBlocks={textBlocksForRephrasing}
          bookId={state.bookId || ''}
          versionId={state.versionId || ''}
          chapterId={selectedChapter?.id || ''}
          onApplyChanges={handleApplyRephrasedText}
          editor={editor}
          action={action}
        />

        
      </div>
    );
  };

  // Export interface for parent components to use
  export interface EditorRichTextEditorRef {
    extractedChanges: any[];
    handleAcceptChange: (changeId: string) => void;
    handleRejectChange: (changeId: string) => void;
    handleChangeClick: (changeId: string) => void;
  }
