
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
            // Store enabled state in the plugin's spec
            (plugin.spec as any).enabled = enabled;
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
            // Check if track changes is enabled
            const plugin = trackChangesPluginKey.get(newState);
            const enabled = plugin ? (plugin.spec as any).enabled !== false : this.options.enabled;
            
            if (!enabled) {
              return DecorationSet.empty;
            }

            decorationSet = decorationSet.map(tr.mapping, tr.doc);

            // Detect insertions and deletions
            if (tr.docChanged) {
              tr.steps.forEach((step: any) => {
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
                    
                    // Add decoration for visual highlighting
                    const decoration = Decoration.inline(
                      from, 
                      from + slice.size, 
                      { 
                        class: 'track-insertion',
                        'data-insertion': changeData 
                      }
                    );
                    decorationSet = decorationSet.add(tr.doc, [decoration]);
                  }
                  
                  // Handle deletions
                  if (from < to && slice.size === 0) {
                    const deletedContent = oldState.doc.slice(from, to);
                    const deletedText = oldState.doc.textBetween(from, to);
                    const changeData = JSON.stringify({ 
                      userId, 
                      userName, 
                      timestamp: Date.now(),
                      type: 'deletion',
                      deletedText: deletedText
                    });
                    
                    // Add decoration to show deleted content
                    const decoration = Decoration.widget(from, () => {
                      const span = document.createElement('span');
                      span.className = 'track-deletion';
                      span.setAttribute('data-deletion', changeData);
                      span.textContent = deletedText;
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
