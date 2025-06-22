// src/extensions/PageAccessControlExtension.ts
import { Extension } from '@tiptap/core'
import { PageAccessControlPlugin } from './PageAccessControlPlugin'

export const PageAccessControlExtension = Extension.create({
  name: 'pageAccessControl',

  addOptions() {
    return {
      currentPage: 0,
      pageCount: 10,
    }
  },

  addProseMirrorPlugins() {
    return [PageAccessControlPlugin(this.options.currentPage, this.options.pageCount)]
  },
})
