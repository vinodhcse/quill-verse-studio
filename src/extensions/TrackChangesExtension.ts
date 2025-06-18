
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
      acceptChange: () => ReturnType;
      rejectChange: () => ReturnType;
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
        },
      },
    ];
  },

  addCommands() {
    return {
      setInsertion:
        (userId: string, userName: string) =>
        ({ commands }) => {
          const changeData = JSON.stringify({ userId, userName, timestamp: Date.now() });
          return commands.setMark('textStyle', { insertion: changeData });
        },
      setDeletion:
        (userId: string, userName: string) =>
        ({ commands }) => {
          const changeData = JSON.stringify({ userId, userName, timestamp: Date.now() });
          return commands.setMark('textStyle', { deletion: changeData });
        },
      acceptChange:
        () =>
        ({ commands }) => {
          return commands.unsetMark('textStyle');
        },
      rejectChange:
        () =>
        ({ commands }) => {
          return commands.deleteSelection();
        },
      toggleTrackChanges:
        (enabled: boolean) =>
        ({ editor }) => {
          const plugin = trackChangesPluginKey.get(editor.state);
          if (plugin) {
            plugin.spec.props.enabled = enabled;
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
        props: {
          enabled: this.options.enabled,
        },
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet, oldState, newState) {
            // Skip if track changes is disabled
            if (!this.spec.props.enabled) {
              return DecorationSet.empty;
            }

            decorationSet = decorationSet.map(tr.mapping, tr.doc);

            // Detect insertions
            if (tr.docChanged) {
              tr.steps.forEach((step: any, index) => {
                if (step.jsonID === 'replace') {
                  const { from, to, slice } = step;
                  
                  // Handle insertions
                  if (slice.size > 0) {
                    const changeData = JSON.stringify({ 
                      userId, 
                      userName, 
                      timestamp: Date.now(),
                      type: 'insertion'
                    });
                    
                    // Apply insertion mark to the inserted content
                    const insertedContent = slice.content;
                    insertedContent.descendants((node, pos) => {
                      if (node.isText) {
                        const mark = newState.schema.marks.textStyle.create({
                          insertion: changeData
                        });
                        
                        // Add decoration for visual highlighting
                        const decoration = Decoration.inline(
                          from + pos, 
                          from + pos + node.nodeSize, 
                          { 
                            class: 'track-insertion',
                            'data-insertion': changeData 
                          }
                        );
                        decorationSet = decorationSet.add(tr.doc, [decoration]);
                      }
                    });
                  }
                  
                  // Handle deletions (mark content as deleted before removing)
                  if (from < to && slice.size === 0) {
                    const deletedContent = oldState.doc.slice(from, to);
                    const changeData = JSON.stringify({ 
                      userId, 
                      userName, 
                      timestamp: Date.now(),
                      type: 'deletion',
                      deletedText: deletedContent.textBetween(0, deletedContent.size)
                    });
                    
                    // Add decoration to show deleted content
                    const decoration = Decoration.widget(from, () => {
                      const span = document.createElement('span');
                      span.className = 'track-deletion';
                      span.setAttribute('data-deletion', changeData);
                      span.textContent = deletedContent.textBetween(0, deletedContent.size);
                      return span;
                    });
                    decorationSet = decorationSet.add(tr.doc, [decoration]);
                  }
                }
              });
            }

            return decorationSet;
          },
        },
        view() {
          return {
            update: (view, prevState) => {
              // Re-apply decorations when view updates
              const plugin = trackChangesPluginKey.get(view.state);
              if (plugin && this.spec.props.enabled) {
                view.updateState(view.state);
              }
            },
          };
        },
      }),
    ];
  },
});
