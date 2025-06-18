
// Utility function to consolidate character-level insertions into word/sentence level before saving
export const consolidateTrackChanges = (editorJSON: any): any => {
  if (!editorJSON || !editorJSON.content) {
    return editorJSON;
  }

  const processContent = (content: any[]): any[] => {
    const result: any[] = [];
    let i = 0;

    while (i < content.length) {
      const item = content[i];
      
      // Process nested content recursively
      if (item.content) {
        item.content = processContent(item.content);
        result.push(item);
        i++;
        continue;
      }

      // Check if this is a text node with insertion marks
      if (item.type === 'text' && item.marks) {
        const insertionMark = item.marks.find((mark: any) => 
          mark.type === 'textStyle' && mark.attrs?.insertion
        );

        if (insertionMark) {
          // Start consolidating consecutive insertions
          let consolidatedText = item.text || '';
          let j = i + 1;

          // Look ahead for consecutive insertions with same user/timestamp
          while (j < content.length) {
            const nextItem = content[j];
            
            if (nextItem.type === 'text' && nextItem.marks) {
              const nextInsertionMark = nextItem.marks.find((mark: any) => 
                mark.type === 'textStyle' && mark.attrs?.insertion
              );

              if (nextInsertionMark && 
                  nextInsertionMark.attrs.insertion === insertionMark.attrs.insertion) {
                consolidatedText += nextItem.text || '';
                j++;
              } else {
                break;
              }
            } else {
              break;
            }
          }

          // Create consolidated node
          const consolidatedNode = {
            ...item,
            text: consolidatedText
          };

          result.push(consolidatedNode);
          i = j; // Skip the consolidated items
        } else {
          result.push(item);
          i++;
        }
      } else {
        result.push(item);
        i++;
      }
    }

    return result;
  };

  return {
    ...editorJSON,
    content: processContent(editorJSON.content)
  };
};
