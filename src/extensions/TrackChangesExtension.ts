
import { Extension } from '@tiptap/core';

export interface TrackChangesOptions {
  userId: string;
  userName: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    trackChanges: {
      setInsertion: (userId: string, userName: string) => ReturnType;
      setDeletion: (userId: string, userName: string) => ReturnType;
      acceptChange: () => ReturnType;
      rejectChange: () => ReturnType;
    };
  }
}

export const TrackChangesExtension = Extension.create<TrackChangesOptions>({
  name: 'trackChanges',

  addOptions() {
    return {
      userId: '',
      userName: '',
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
    };
  },
});
