import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface TrackChangesOptions {
  userId: string;
  userName: string;
  enabled: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    trackChanges: {
      setInsertion: (userId: string, userName: string) => ReturnType;
      setDeletion: (userId: string, userName: string) => ReturnType;
      acceptChange: (changeId?: string) => ReturnType;
      rejectChange: (changeId?: string) => ReturnType;
      toggleTrackChanges: (enabled: boolean) => ReturnType;
    };
  }
}

const trackChangesPluginKey = new PluginKey('trackChanges');

export const TrackChangesExtension = Extension.create<TrackChangesOptions>({
  name: 'trackChanges',

  addOptions() {
    return {
      userId: '',
      userName: '',
      enabled: true,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          insertion: {
            default: null,
            parseHTML: element => element.getAttribute('data-insertion'),
            renderHTML: attributes => {
              if (!attributes.insertion) {
                return {};
              }
              return {
                'data-insertion': attributes.insertion,
                class: 'track-insertion',
              };
            },
          },
          deletion: {
            default: null,
            parseHTML: element => element.getAttribute('data-deletion'),
            renderHTML: attributes => {
              if (!attributes.deletion) {
                return {};
              }
              return {
                'data-deletion': attributes.deletion,
                class: 'track-deletion',
              };
            },
          },
          changeId: {
            default: null,
            parseHTML: element => element.getAttribute('data-change-id'),
            renderHTML: attributes => {
              if (!attributes.changeId) {
                return {};
              }
              return {
                'data-change-id': attributes.changeId,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setInsertion:
        (userId: string, userName: string) =>
        ({ commands }) => {
          const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const changeData = JSON.stringify({ userId, userName, timestamp: Date.now() });
          return commands.setMark('textStyle', { 
            insertion: changeData,
            changeId: changeId 
          });
        },
      setDeletion:
        (userId: string, userName: string) =>
        ({ commands }) => {
          const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const changeData = JSON.stringify({ userId, userName, timestamp: Date.now() });
          return commands.setMark('textStyle', { 
            deletion: changeData,
            changeId: changeId 
          });
        },
      acceptChange:
        (changeId?: string) =>
        ({ editor, commands }) => {
          if (changeId) {
            // Find and remove specific change marks
            const { state } = editor;
            const { tr } = state;
            let modified = false;

            state.doc.descendants((node, pos) => {
              if (node.marks) {
                node.marks.forEach(mark => {
                  if (mark.type.name === 'textStyle' && 
                      mark.attrs.changeId === changeId) {
                    // Remove the track changes marks but keep the text
                    const newAttrs = { ...mark.attrs };
                    delete newAttrs.insertion;
                    delete newAttrs.deletion;
                    delete newAttrs.changeId;
                    
                    if (Object.keys(newAttrs).length === 0) {
                      tr.removeMark(pos, pos + node.nodeSize, mark.type);
                    } else {
                      tr.addMark(pos, pos + node.nodeSize, 
                        mark.type.create(newAttrs));
                    }
                    modified = true;
                  }
                });
              }
            });

            if (modified) {
              editor.view.dispatch(tr);
            }
            return true;
          }
          
          // Accept all changes if no specific ID
          return commands.unsetMark('textStyle');
        },
      rejectChange:
        (changeId?: string) =>
        ({ editor, commands }) => {
          if (changeId) {
            const { state } = editor;
            const { tr } = state;
            let modified = false;

            state.doc.descendants((node, pos) => {
              if (node.marks) {
                node.marks.forEach(mark => {
                  if (mark.type.name === 'textStyle' && 
                      mark.attrs.changeId === changeId) {
                    
                    // For insertions: remove the text
                    if (mark.attrs.insertion) {
                      tr.delete(pos, pos + node.nodeSize);
                      modified = true;
                    }
                    // For deletions: restore the text and remove deletion mark
                    else if (mark.attrs.deletion) {
                      const newAttrs = { ...mark.attrs };
                      delete newAttrs.deletion;
                      delete newAttrs.changeId;
                      
                      if (Object.keys(newAttrs).length === 0) {
                        tr.removeMark(pos, pos + node.nodeSize, mark.type);
                      } else {
                        tr.addMark(pos, pos + node.nodeSize, 
                          mark.type.create(newAttrs));
                      }
                      modified = true;
                    }
                  }
                });
              }
            });

            if (modified) {
              editor.view.dispatch(tr);
            }
            return true;
          }
          
          return commands.deleteSelection();
        },
      toggleTrackChanges:
        (enabled: boolean) =>
        ({ editor }) => {
          const plugin = trackChangesPluginKey.get(editor.state);
          if (plugin) {
            (plugin.spec as any).enabled = enabled;
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { userId, userName } = this.options;
    let pendingInsertion = '';
    let insertionStart = -1;
    let insertionTimeout: NodeJS.Timeout | null = null;

    const commitPendingInsertion = (editor: any) => {
      if (pendingInsertion && insertionStart >= 0) {
        const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const changeData = JSON.stringify({ userId, userName, timestamp: Date.now() });
        
        // Apply mark to the entire pending insertion
        editor.commands.setTextSelection({
          from: insertionStart,
          to: insertionStart + pendingInsertion.length
        });
        editor.commands.setMark('textStyle', {
          insertion: changeData,
          changeId: changeId
        });
        
        pendingInsertion = '';
        insertionStart = -1;
      }
    };

    return [
      new Plugin({
        key: trackChangesPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet, oldState, newState) {
            const plugin = trackChangesPluginKey.get(newState);
            const enabled = plugin ? (plugin.spec as any).enabled !== false : this.options.enabled;
            
            if (!enabled) {
              return DecorationSet.empty;
            }

            decorationSet = decorationSet.map(tr.mapping, tr.doc);

            if (tr.docChanged) {
              tr.steps.forEach((step: any) => {
                if (step.jsonID === 'replace') {
                  const { from, to, slice } = step;
                  
                  // Handle selection replacement (selected text + new text)
                  if (from < to && slice.size > 0) {
                    // Mark original text as deleted
                    const deletedText = oldState.doc.textBetween(from, to);
                    if (deletedText) {
                      const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                      const changeData = JSON.stringify({ 
                        userId, 
                        userName, 
                        timestamp: Date.now(),
                        type: 'deletion',
                        deletedText: deletedText
                      });
                      
                      const decoration = Decoration.widget(from, () => {
                        const span = document.createElement('span');
                        span.className = 'track-deletion';
                        span.setAttribute('data-deletion', changeData);
                        span.setAttribute('data-change-id', changeId);
                        span.textContent = deletedText;
                        return span;
                      });
                      decorationSet = decorationSet.add(tr.doc, [decoration]);
                    }
                    
                    // Start tracking the new insertion
                    const newText = slice.content.textBetween(0, slice.content.size);
                    if (newText) {
                      if (insertionStart === -1) {
                        insertionStart = from;
                        pendingInsertion = newText;
                      } else {
                        pendingInsertion += newText;
                      }
                      
                      // Clear existing timeout and set new one
                      if (insertionTimeout) {
                        clearTimeout(insertionTimeout);
                      }
                      
                      insertionTimeout = setTimeout(() => {
                        commitPendingInsertion(tr.getMeta('editor'));
                      }, 500); // Wait 500ms after last keystroke
                    }
                  }
                  // Handle pure insertions
                  else if (slice.size > 0) {
                    const newText = slice.content.textBetween(0, slice.content.size);
                    if (newText) {
                      if (insertionStart === -1) {
                        insertionStart = from;
                        pendingInsertion = newText;
                      } else if (from === insertionStart + pendingInsertion.length) {
                        // Continuing previous insertion
                        pendingInsertion += newText;
                      } else {
                        // New insertion at different position
                        commitPendingInsertion(tr.getMeta('editor'));
                        insertionStart = from;
                        pendingInsertion = newText;
                      }
                      
                      if (insertionTimeout) {
                        clearTimeout(insertionTimeout);
                      }
                      
                      insertionTimeout = setTimeout(() => {
                        commitPendingInsertion(tr.getMeta('editor'));
                      }, 500);
                    }
                  }
                  // Handle pure deletions
                  else if (from < to && slice.size === 0) {
                    const deletedText = oldState.doc.textBetween(from, to);
                    if (deletedText) {
                      const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                      const changeData = JSON.stringify({ 
                        userId, 
                        userName, 
                        timestamp: Date.now(),
                        type: 'deletion',
                        deletedText: deletedText
                      });
                      
                      const decoration = Decoration.widget(from, () => {
                        const span = document.createElement('span');
                        span.className = 'track-deletion';
                        span.setAttribute('data-deletion', changeData);
                        span.setAttribute('data-change-id', changeId);
                        span.textContent = deletedText;
                        return span;
                      });
                      decorationSet = decorationSet.add(tr.doc, [decoration]);
                    }
                  }
                }
              });
            }

            return decorationSet;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
        spec: {
          enabled: this.options.enabled,
        } as any,
      }),
    ];
  },
});
