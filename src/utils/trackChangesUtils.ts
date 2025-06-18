
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
          const consecutiveItems = [item];
          
          // Get all marks from the first item for comparison
          const firstItemMarks = item.marks || [];
          const nonInsertionMarks = firstItemMarks.filter((mark: any) => 
            !(mark.type === 'textStyle' && mark.attrs?.insertion)
          );

          try {
            const currentData = JSON.parse(insertionData);
            
            // Look ahead for consecutive insertions with same user AND same marks
            while (j < content.length) {
              const nextItem = content[j];
              
              if (nextItem.type === 'text' && nextItem.marks) {
                const nextInsertionMark = nextItem.marks.find((mark: any) => 
                  mark.type === 'textStyle' && mark.attrs?.insertion
                );

                // Check if the insertion data matches (same user)
                if (nextInsertionMark && nextInsertionMark.attrs.insertion) {
                  try {
                    const nextData = JSON.parse(nextInsertionMark.attrs.insertion);
                    
                    // Get non-insertion marks from next item
                    const nextNonInsertionMarks = nextItem.marks.filter((mark: any) => 
                      !(mark.type === 'textStyle' && mark.attrs?.insertion)
                    );
                    
                    // Check if user matches AND marks are similar
                    const marksMatch = compareMarks(nonInsertionMarks, nextNonInsertionMarks);
                    
                    if (currentData.userId === nextData.userId && marksMatch) {
                      consolidatedText += nextItem.text || '';
                      consecutiveItems.push(nextItem);
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
              console.log(`Consolidating ${j - i} insertion nodes from user ${currentData.userName}:`, consolidatedText);
              
              // Preserve all marks from the first item, including styling
              const consolidatedMarks = [...firstItemMarks.map((mark: any) => {
                if (mark.type === 'textStyle' && mark.attrs?.insertion) {
                  return {
                    ...mark,
                    attrs: {
                      ...mark.attrs,
                      changeId: `consolidated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    }
                  };
                }
                return mark;
              })];
              
              const consolidatedNode = {
                type: 'text',
                text: consolidatedText,
                marks: consolidatedMarks
              };
              result.push(consolidatedNode);
              i = j; // Skip the consolidated items
            } else {
              result.push(item);
              i++;
            }
          } catch (e) {
            // If parsing fails, just add the item as-is
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

  console.log('Original content nodes:', editorJSON.content?.length || 0);
  console.log('Consolidated content nodes:', consolidated.content?.length || 0);
  
  return consolidated;
};

// Helper function to compare marks (excluding insertion marks)
const compareMarks = (marks1: any[], marks2: any[]): boolean => {
  if (marks1.length !== marks2.length) {
    return false;
  }
  
  // Sort marks by type for comparison
  const sortedMarks1 = marks1.slice().sort((a, b) => a.type.localeCompare(b.type));
  const sortedMarks2 = marks2.slice().sort((a, b) => a.type.localeCompare(b.type));
  
  for (let i = 0; i < sortedMarks1.length; i++) {
    const mark1 = sortedMarks1[i];
    const mark2 = sortedMarks2[i];
    
    if (mark1.type !== mark2.type) {
      return false;
    }
    
    // For textStyle marks, compare relevant attributes (excluding insertion/deletion)
    if (mark1.type === 'textStyle') {
      const attrs1 = { ...mark1.attrs };
      const attrs2 = { ...mark2.attrs };
      
      // Remove insertion/deletion specific attributes
      delete attrs1.insertion;
      delete attrs1.deletion;
      delete attrs1.changeId;
      delete attrs2.insertion;
      delete attrs2.deletion;
      delete attrs2.changeId;
      
      if (JSON.stringify(attrs1) !== JSON.stringify(attrs2)) {
        return false;
      }
    }
  }
  
  return true;
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
