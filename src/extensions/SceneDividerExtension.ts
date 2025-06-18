
import { Node } from '@tiptap/core';

export const SceneDivider = Node.create({
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
