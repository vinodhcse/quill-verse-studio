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
  
  if (!content) {
    console.log('extractChangesFromContent: No content provided');
    return changes;
  }

  console.log('extractChangesFromContent: Processing content structure:', content);

  // Handle different content structures - prioritize blocks structure
  let contentArray: any[] = [];
  if (content.blocks && Array.isArray(content.blocks)) {
    contentArray = content.blocks;
    console.log('extractChangesFromContent: Using content.blocks structure');
  } else if (content.content && Array.isArray(content.content)) {
    contentArray = content.content;
    console.log('extractChangesFromContent: Using content.content structure');
  } else if (Array.isArray(content)) {
    contentArray = content;
    console.log('extractChangesFromContent: Using direct array structure');
  } else {
    console.log('extractChangesFromContent: Unrecognized content structure, attempting to process as single node');
    contentArray = [content];
  }

  const extractFromNode = (node: any, path: string = '') => {
    console.log(`extractFromNode: Processing node at path ${path}:`, node);
    
    if (node.marks && Array.isArray(node.marks)) {
      console.log(`extractFromNode: Found ${node.marks.length} marks`);
      
      node.marks.forEach((mark: any, markIndex: number) => {
        console.log(`extractFromNode: Processing mark ${markIndex}:`, mark);
        
        if (mark.type === 'textStyle' && mark.attrs) {
          const attrs = mark.attrs;
          console.log('extractFromNode: Found textStyle mark with attrs:', attrs);
          
          // Extract changeId
          let changeId = attrs.changeId;
          if (!changeId || typeof changeId !== 'string') {
            changeId = `change_${Date.now()}_${markIndex}`;
          }
          
          // Extract insertion data
          let insertion = null;
          let userId = 'unknown';
          let userName = 'Unknown User';
          let timestamp = Date.now();
          
          if (attrs.insertion && attrs.insertion !== null) {
            if (typeof attrs.insertion === 'string') {
              try {
                const insertionData = JSON.parse(attrs.insertion);
                console.log('extractFromNode: Parsed insertion data:', insertionData);
                insertion = insertionData;
                userId = insertionData.userId || 'unknown';
                userName = insertionData.userName || 'Unknown User';
                timestamp = insertionData.timestamp || Date.now();
              } catch (e) {
                console.log('extractFromNode: Failed to parse insertion data:', e);
                insertion = true;
              }
            } else {
              insertion = attrs.insertion;
            }
          }
          
          // Extract deletion data
          let deletion = null;
          if (attrs.deletion && attrs.deletion !== null) {
            if (typeof attrs.deletion === 'string') {
              try {
                const deletionData = JSON.parse(attrs.deletion);
                console.log('extractFromNode: Parsed deletion data:', deletionData);
                deletion = deletionData;
                userId = deletionData.userId || userId;
                userName = deletionData.userName || userName;
                timestamp = deletionData.timestamp || timestamp;
              } catch (e) {
                console.log('extractFromNode: Failed to parse deletion data:', e);
                deletion = true;
              }
            } else {
              deletion = attrs.deletion;
            }
          }

          // Create change entry if we have insertion or deletion
          if ((insertion || deletion) && changeId) {
            const existingChange = changes.find(c => c.id === changeId);
            
            if (!existingChange) {
              const change: Change = {
                id: changeId,
                type: insertion ? 'insertion' : 'deletion',
                text: node.text || 'Text change',
                user: userName,
                userId: userId,
                timestamp: timestamp,
                changeData: {
                  insertion,
                  deletion,
                  userId,
                  userName
                }
              };
              
              console.log('extractFromNode: Created new change:', change);
              changes.push(change);
            } else {
              // Append text to existing change
              existingChange.text += node.text || '';
              console.log('extractFromNode: Appended text to existing change:', existingChange);
            }
          }
        }
      });
    }

    // Process nested content recursively
    if (node.content && Array.isArray(node.content)) {
      console.log(`extractFromNode: Processing ${node.content.length} child nodes`);
      node.content.forEach((child: any, index: number) => {
        extractFromNode(child, `${path}.content.${index}`);
      });
    }
  };

  console.log(`extractChangesFromContent: Processing ${contentArray.length} nodes`);
  contentArray.forEach((node, index) => {
    extractFromNode(node, `root.${index}`);
  });
  
  console.log('extractChangesFromContent: Final extracted changes:', changes);
  console.log('extractChangesFromContent: Total changes found:', changes.length);
  
  return changes;
};
