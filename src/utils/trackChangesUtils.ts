
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
          const insertionData = insertionMark.attrs.insertion;

          // Look ahead for consecutive insertions with same user/timestamp data
          while (j < content.length) {
            const nextItem = content[j];
            
            if (nextItem.type === 'text' && nextItem.marks) {
              const nextInsertionMark = nextItem.marks.find((mark: any) => 
                mark.type === 'textStyle' && mark.attrs?.insertion
              );

              // Check if the insertion data matches (same user and close timestamp)
              if (nextInsertionMark && nextInsertionMark.attrs.insertion) {
                try {
                  const currentData = JSON.parse(insertionData);
                  const nextData = JSON.parse(nextInsertionMark.attrs.insertion);
                  
                  // Consider insertions from same user within 1 second as part of same edit
                  if (currentData.userId === nextData.userId && 
                      Math.abs(currentData.timestamp - nextData.timestamp) < 1000) {
                    consolidatedText += nextItem.text || '';
                    j++;
                  } else {
                    break;
                  }
                } catch (e) {
                  break;
                }
              } else {
                break;
              }
            } else {
              break;
            }
          }

          // Create consolidated node if we found consecutive insertions
          if (j > i + 1) {
            console.log(`Consolidating ${j - i} insertion nodes into one:`, consolidatedText);
            const consolidatedNode = {
              type: 'text',
              text: consolidatedText,
              marks: [{
                type: 'textStyle',
                attrs: {
                  insertion: insertionData,
                  changeId: `consolidated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }
              }]
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
      } else {
        result.push(item);
        i++;
      }
    }

    return result;
  };

  const consolidated = {
    ...editorJSON,
    content: processContent(editorJSON.content)
  };

  console.log('Original content:', editorJSON);
  console.log('Consolidated content:', consolidated);
  
  return consolidated;
};

// Helper function to parse change data and extract user info
export const parseChangeData = (changeDataStr: string) => {
  try {
    return JSON.parse(changeDataStr);
  } catch {
    return null;
  }
};

// Helper function to extract all changes from editor content
export const extractChangesFromContent = (content: any): any[] => {
  const changes: any[] = [];

  const processContent = (contentArray: any[]) => {
    contentArray.forEach((item) => {
      if (item.content) {
        processContent(item.content);
      }
      
      if (item.type === 'text' && item.marks) {
        item.marks.forEach((mark: any) => {
          if (mark.type === 'textStyle') {
            if (mark.attrs?.insertion) {
              const changeData = parseChangeData(mark.attrs.insertion);
              if (changeData) {
                changes.push({
                  id: mark.attrs.changeId || `change-${Date.now()}`,
                  type: 'insertion',
                  text: item.text,
                  user: changeData.userName || 'Unknown',
                  userId: changeData.userId,
                  timestamp: changeData.timestamp,
                  changeData: mark.attrs
                });
              }
            }
            if (mark.attrs?.deletion) {
              const changeData = parseChangeData(mark.attrs.deletion);
              if (changeData) {
                changes.push({
                  id: mark.attrs.changeId || `change-${Date.now()}`,
                  type: 'deletion',
                  text: changeData.deletedText || item.text,
                  user: changeData.userName || 'Unknown',
                  userId: changeData.userId,
                  timestamp: changeData.timestamp,
                  changeData: mark.attrs
                });
              }
            }
          }
        });
      }
    });
  };

  if (content?.content) {
    processContent(content.content);
  }

  return changes;
};
