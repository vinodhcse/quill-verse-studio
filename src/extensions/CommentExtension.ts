
import { Extension } from '@tiptap/core';

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (commentId: string) => ReturnType;
      unsetComment: () => ReturnType;
    };
  }
}

export const CommentExtension = Extension.create<CommentOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          commentId: {
            default: null,
            parseHTML: element => element.getAttribute('data-comment-id'),
            renderHTML: attributes => {
              if (!attributes.commentId) {
                return {};
              }
              return {
                'data-comment-id': attributes.commentId,
                class: 'comment-highlight',
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark('textStyle', { commentId });
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark('textStyle');
        },
    };
  },
});
