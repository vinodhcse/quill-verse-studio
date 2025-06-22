import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export function PageAccessControlPlugin(currentPage = 0, totalPages = 100) {
  return new Plugin({
    props: {
      decorations(state) {
        const decorations: Decoration[] = []

        const doc = state.doc
        const pageSize = 800 // chars per page
        const fromChar = currentPage * pageSize
        const toChar = (currentPage + 3) * pageSize // show 3 pages

        let charCount = 0

        doc.descendants((node, pos) => {
          const nodeSize = node.nodeSize
          const start = charCount
          const end = charCount + node.textContent.length
          const isWithinRange = end >= fromChar && start <= toChar

          if (!isWithinRange && node.isTextblock) {
            decorations.push(
              Decoration.node(pos, pos + nodeSize, {
                class: 'blurred-page',
              })
            )
          }

          charCount += node.textContent.length
          return true
        })

        return DecorationSet.create(doc, decorations)
      },
    },
  })
}
