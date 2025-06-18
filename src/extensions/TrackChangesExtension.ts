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
      consolidateInsertions: () => ReturnType;
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
            (plugin.spec as any).trackChangesEnabled = enabled;
          }
          return true;
        },
      consolidateInsertions:
        () =>
        ({ editor }) => {
          const { state } = editor;
          const { tr } = state;
          let modified = false;
          const consolidatedNodes: any[] = [];

          // Group consecutive insertion nodes
          state.doc.descendants((node, pos) => {
            if (node.isText && node.marks) {
              const insertionMark = node.marks.find(mark => 
                mark.type.name === 'textStyle' && mark.attrs.insertion
              );
              
              if (insertionMark) {
                const lastGroup = consolidatedNodes[consolidatedNodes.length - 1];
                
                if (lastGroup && 
                    lastGroup.insertionData === insertionMark.attrs.insertion &&
                    lastGroup.endPos === pos) {
                  // Extend the last group
                  lastGroup.text += node.text;
                  lastGroup.endPos = pos + node.nodeSize;
                  lastGroup.nodes.push({ node, pos });
                } else {
                  // Start a new group
                  consolidatedNodes.push({
                    insertionData: insertionMark.attrs.insertion,
                    changeId: insertionMark.attrs.changeId,
                    text: node.text,
                    startPos: pos,
                    endPos: pos + node.nodeSize,
                    nodes: [{ node, pos }]
                  });
                }
              }
            }
          });

          // Replace groups with single nodes
          consolidatedNodes.reverse().forEach(group => {
            if (group.nodes.length > 1) {
              // Remove all individual nodes
              group.nodes.forEach(({ pos, node }) => {
                tr.delete(pos, pos + node.nodeSize);
              });
              
              // Insert consolidated text
              const insertionMark = editor.schema.marks.textStyle.create({
                insertion: group.insertionData,
                changeId: group.changeId
              });
              
              tr.insert(group.startPos, editor.schema.text(group.text, [insertionMark]));
              modified = true;
            }
          });

          if (modified) {
            editor.view.dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { userId, userName } = this.options;

    return [
      new Plugin({
        key: trackChangesPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet, oldState, newState) {
            const plugin = trackChangesPluginKey.get(newState);
            const enabled = plugin ? (plugin.spec as any).trackChangesEnabled !== false : this.options.enabled;
            
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
          handleTextInput(view, from, to, text) {
            const plugin = trackChangesPluginKey.get(view.state);
            const enabled = plugin ? (plugin.spec as any).trackChangesEnabled !== false : true;
            
            if (!enabled) {
              return false;
            }

            // Mark new insertions immediately at character level
            const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const changeData = JSON.stringify({ userId, userName, timestamp: Date.now() });
            
            const tr = view.state.tr;
            tr.insertText(text, from, to);
            
            // Apply insertion mark to the new text
            const insertionMark = view.state.schema.marks.textStyle.create({
              insertion: changeData,
              changeId: changeId
            });
            
            tr.addMark(from, from + text.length, insertionMark);
            view.dispatch(tr);
            
            return true;
          },
        },
        spec: {
          trackChangesEnabled: this.options.enabled,
        } as any,
      }),
    ];
  },
});
