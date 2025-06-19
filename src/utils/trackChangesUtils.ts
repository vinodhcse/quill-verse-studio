// Utility function to consolidate character-level insertions into word/sentence level before saving
export const consolidateTrackChanges = (editorJSON: any): any => {
  if (!editorJSON || !editorJSON.content) {
    return editorJSON;
  }

  // Helper function to compare marks arrays
  const marksAreEqual = (marks1: any[], marks2: any[]): boolean => {
    if (!marks1 && !marks2) return true;
    if (!marks1 || !marks2) return false;
    if (marks1.length !== marks2.length) return false;
    
    // Sort marks by type for consistent comparison
    const sortedMarks1 = [...marks1].sort((a, b) => a.type.localeCompare(b.type));
    const sortedMarks2 = [...marks2].sort((a, b) => a.type.localeCompare(b.type));
    
    return sortedMarks1.every((mark1, index) => {
      const mark2 = sortedMarks2[index];
      if (mark1.type !== mark2.type) return false;
      
      // For textStyle marks, compare all attributes except insertion data
      if (mark1.type === 'textStyle') {
        const attrs1 = { ...mark1.attrs };
        const attrs2 = { ...mark2.attrs };
        
        // Remove insertion/deletion data for comparison (these can be different)
        delete attrs1.insertion;
        delete attrs1.deletion;
        delete attrs1.changeId;
        delete attrs2.insertion;
        delete attrs2.deletion;
        delete attrs2.changeId;
        
        return JSON.stringify(attrs1) === JSON.stringify(attrs2);
      }
      
      // For other marks, compare attributes directly
      return JSON.stringify(mark1.attrs || {}) === JSON.stringify(mark2.attrs || {});
    });
  };

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

          try {
            const currentData = JSON.parse(insertionData);
            
            // Look ahead for consecutive insertions with same user AND same styling
            while (j < content.length) {
              const nextItem = content[j];
              
              if (nextItem.type === 'text' && nextItem.marks) {
                const nextInsertionMark = nextItem.marks.find((mark: any) => 
                  mark.type === 'textStyle' && mark.attrs?.insertion
                );

                // Check if the insertion data matches (same user) AND marks are identical
                if (nextInsertionMark && nextInsertionMark.attrs.insertion) {
                  try {
                    const nextData = JSON.parse(nextInsertionMark.attrs.insertion);
                    
                    // Consolidate insertions from same user with identical styling
                    if (currentData.userId === nextData.userId && marksAreEqual(item.marks, nextItem.marks)) {
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

            // Create consolidated node if we found consecutive insertions with same styling
            if (j > i + 1) {
              console.log(`Consolidating ${j - i} insertion nodes from user ${currentData.userName} with identical styling:`, consolidatedText);
              const consolidatedNode = {
                type: 'text',
                text: consolidatedText,
                marks: item.marks.map((mark: any) => {
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
                })
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

// Helper function to parse change data and extract user info
export const parseChangeData = (changeDataStr: string) => {
  try {
    return JSON.parse(changeDataStr);
  } catch {
    return null;
  }
};

// Helper function to extract all changes from editor content
export const extractChangesFromContent = (content: any): Change[] => {
  const changes: Change[] = [];
  
  if (!content || !content.content) {
    return changes;
  }

  const extractFromNode = (node: any, path: string = '') => {
    if (node.marks) {
      node.marks.forEach((mark: any, markIndex: number) => {
        if (mark.type === 'textStyle' && mark.attrs) {
          const attrs = mark.attrs;
          
          // Handle deep nested structure and MaxDepthReached values
          let changeId, insertion, deletion, userId, userName;
          
          // Extract changeId
          if (attrs.changeId) {
            if (typeof attrs.changeId === 'object' && attrs.changeId._type === 'MaxDepthReached') {
              changeId = `change_${Date.now()}_${markIndex}`;
            } else if (typeof attrs.changeId === 'string') {
              changeId = attrs.changeId;
            } else {
              changeId = `change_${Date.now()}_${markIndex}`;
            }
          }
          
          // Extract insertion data
          if (attrs.insertion) {
            if (typeof attrs.insertion === 'object' && attrs.insertion._type === 'MaxDepthReached') {
              insertion = true; // Assume it's an insertion if MaxDepthReached
            } else if (typeof attrs.insertion === 'string') {
              try {
                const insertionData = JSON.parse(attrs.insertion);
                insertion = insertionData;
                userId = insertionData.userId || 'unknown';
                userName = insertionData.userName || 'Unknown User';
              } catch {
                insertion = true;
              }
            } else {
              insertion = attrs.insertion;
            }
          }
          
          // Extract deletion data
          if (attrs.deletion) {
            if (typeof attrs.deletion === 'object' && attrs.deletion._type === 'MaxDepthReached') {
              deletion = true; // Assume it's a deletion if MaxDepthReached
            } else if (typeof attrs.deletion === 'string') {
              try {
                const deletionData = JSON.parse(attrs.deletion);
                deletion = deletionData;
                userId = deletionData.userId || 'unknown';
                userName = deletionData.userName || 'Unknown User';
              } catch {
                deletion = true;
              }
            } else {
              deletion = attrs.deletion;
            }
          }
          
          // Extract user info from other attributes if not found in insertion/deletion
          if (!userId && attrs.userId) {
            if (typeof attrs.userId === 'object' && attrs.userId._type === 'MaxDepthReached') {
              userId = 'unknown';
            } else {
              userId = attrs.userId;
            }
          }
          
          if (!userName && attrs.userName) {
            if (typeof attrs.userName === 'object' && attrs.userName._type === 'MaxDepthReached') {
              userName = 'Unknown User';
            } else {
              userName = attrs.userName;
            }
          }

          // Create change entry if we have insertion or deletion
          if ((insertion || deletion) && changeId) {
            const existingChange = changes.find(c => c.id === changeId);
            
            if (!existingChange) {
              changes.push({
                id: changeId,
                type: insertion ? 'insertion' : 'deletion',
                text: node.text || 'Text change',
                user: userName || 'Unknown User',
                userId: userId || 'unknown',
                timestamp: Date.now(),
                changeData: {
                  insertion,
                  deletion,
                  userId,
                  userName
                }
              });
            } else {
              // Append text to existing change
              existingChange.text += node.text || '';
            }
          }
        }
      });
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: any, index: number) => {
        extractFromNode(child, `${path}.${index}`);
      });
    }
  };

  extractFromNode(content);
  
  console.log('Extracted changes from content:', changes);
  return changes;
};
