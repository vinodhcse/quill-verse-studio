
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mode } from './ModeNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditorRichTextEditor } from '@/components/EditorRichTextEditor';
import { TrackChangesToggle } from '@/components/TrackChangesToggle';
import { Plus, Edit, UploadCloud, Settings } from 'lucide-react';
import { useBookContext } from '@/lib/BookContextProvider';
import { apiClient } from '@/lib/api';
import { debounce } from 'lodash';
import { ChapterLinkModal } from '@/components/ChapterLinkModal';

export const CenterPanel: React.FC<{ mode: Mode }> = ({ mode }) => {
  const { state, dispatch } = useBookContext();
  const { selectedChapter, bookId, versionId } = state;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(selectedChapter?.title || '');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [showTrackChanges, setShowTrackChanges] = useState(false);
  const [showChapterLinkModal, setShowChapterLinkModal] = useState(false);
  const statusRef = useRef('');

  const latestContentRef = useRef(selectedChapter?.content?.blocks || []);

  useEffect(() => {
    setNewTitle(selectedChapter?.title || '');
  }, [selectedChapter]);

  useEffect(() => {
    if (newImage) {
      handleImageUpload();
    }
  }, [newImage]);

  useEffect(() => {
    if (selectedChapter?.content) {
      statusRef.current = 'Latest';
    }
  }, [selectedChapter?.content]);

  useEffect(() => {
    if (selectedChapter?.content?.blocks) {
      statusRef.current = 'Latest';
    } else {
      statusRef.current = 'Latest';
    }
  }, [selectedChapter]);

  const handleTitleChange = async () => {
    try {
      await apiClient.patch(`/books/${bookId}/versions/${versionId}/chapters/${selectedChapter?.id}`, {
        title: newTitle,
      });

      const updatedChapters = state.chapters.map((chapter) =>
        chapter.id === selectedChapter?.id ? { ...chapter, title: newTitle } : chapter
      );

      dispatch({ type: 'SET_CHAPTERS', payload: updatedChapters });
      dispatch({ type: 'SET_SELECTED_CHAPTER', payload: { ...selectedChapter, title: newTitle } });

      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update chapter title:', error);
    }
  };

  const handleChapterLinkSave = async (linkedNodeId: string | null) => {
    try {
      await apiClient.patch(`/books/${bookId}/versions/${versionId}/chapters/${selectedChapter?.id}`, {
        linkedPlotNodeId: linkedNodeId,
      });

      const updatedChapters = state.chapters.map((chapter) =>
        chapter.id === selectedChapter?.id ? { ...chapter, linkedPlotNodeId: linkedNodeId } : chapter
      );

      dispatch({ type: 'SET_CHAPTERS', payload: updatedChapters });
      dispatch({ type: 'SET_SELECTED_CHAPTER', payload: { ...selectedChapter, linkedPlotNodeId: linkedNodeId } });

      console.log('Chapter linked to plot node:', linkedNodeId);
    } catch (error) {
      console.error('Failed to link chapter to plot node:', error);
    }
  };

  const handleImageUpload = async () => {
    if (!newImage) {
      console.error('No image selected for upload');
      return;
    }

    console.log('Uploading new image:', newImage.name);

    try {
      const formData = new FormData();
      formData.append('file', newImage);

      const uploadResponse = await apiClient.post(`/books/${bookId}/versions/${versionId}/chapters/${selectedChapter?.id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadResponse.data.url;

      await apiClient.patch(`/books/${bookId}/versions/${versionId}/chapters/${selectedChapter?.id}`, {
        image: imageUrl,
      });

      const updatedChapters = state.chapters.map((chapter) =>
        chapter.id === selectedChapter?.id ? { ...chapter, image: imageUrl } : chapter
      );

      dispatch({ type: 'SET_CHAPTERS', payload: updatedChapters });
      dispatch({ type: 'SET_SELECTED_CHAPTER', payload: { ...selectedChapter, image: imageUrl } });

      console.log('Image upload and update successful');
      setNewImage(null);
    } catch (error) {
      console.error('Failed to upload and update chapter image:', error);
    }
  };

  const debouncedHandleTitleChange = useCallback(
    debounce(handleTitleChange, 10),
    [newTitle]
  );

  const saveContent = useCallback(
    debounce(async (content) => {
      console.log('saveContent triggered with content:', content);
      try {
        statusRef.current = 'Saving';
        setStatus('Saving');
        const currentContent = latestContentRef.current;
        if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
          await apiClient.patch(`/books/${bookId}/versions/${versionId}/chapters/${selectedChapter?.id}`, {
            content,
          });
          latestContentRef.current = content;
          statusRef.current = 'Saved';
          setStatus('Saved');
        } else {
          statusRef.current = 'Latest';
          setStatus('Latest');
        }
      } catch (error) {
        console.error('Failed to save chapter content:', error);
        statusRef.current = 'Changed';
        setStatus('Changed');
      }
    }, 10000),
    [bookId, versionId, selectedChapter?.id]
  );

  const onChangeHandler = (changedContent, totalCharacters, totalWords) => {
    try {
      console.log('onChangeHandler triggered with content:', changedContent);
      let parsedContent = changedContent;
      if (typeof changedContent === 'string') {
        console.log('Parsing content as JSON');
        parsedContent = JSON.parse(changedContent);
      } else {
        console.log('Content is already an object, no parsing needed');
      }
      const tiptapBlocks = parsedContent?.content || [];
      setStatus('Changed');
      statusRef.current = 'Changed';
      saveContent({ blocks: tiptapBlocks, metadata: { totalCharacters, totalWords } });
    } catch (error) {
      console.error('Failed to parse content:', error);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'writing':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {selectedChapter?.image && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50">
                      <img 
                        src={selectedChapter.image} 
                        alt="Chapter" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <input
                      id="imageUploadInput"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          console.log('Selected new image:', file.name);
                          setNewImage(file);
                          handleImageUpload();
                        } else {
                          console.log('No valid image selected');
                        }
                      }}
                    />
                    
                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={handleTitleChange}
                        className="border border-border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h2
                          className="text-lg font-semibold cursor-pointer"
                          onClick={() => setIsEditingTitle(true)}
                        >
                          {selectedChapter?.title || 'Untitled Chapter'}
                        </h2>
                        <Edit
                          className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-primary"
                          onClick={() => setIsEditingTitle(true)}
                        />
                      </div>
                    )}
                    <UploadCloud
                      className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-primary"
                      onClick={() => document.getElementById('imageUploadInput')?.click()}
                    />
                    <Settings
                      className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-primary"
                      onClick={() => setShowChapterLinkModal(true)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Status: {statusRef.current}</span>
                  <div className="w-4 h-4 rounded-full bg-primary" title={statusRef.current}></div>
                </div>
                <TrackChangesToggle
                  showChanges={showTrackChanges}
                  onToggle={setShowTrackChanges}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <EditorRichTextEditor
                key={selectedChapter?.id}
                content={selectedChapter?.content?.blocks?.length ? {
                  type: 'doc',
                  content: selectedChapter.content.blocks
                } : null}
                onChange={onChangeHandler}
                placeholder="Start writing your story..."
                className="h-full"
                blockId="block_001"
                selectedChapter={selectedChapter}
                showTrackChanges={showTrackChanges}
                onTrackChangesToggle={setShowTrackChanges}
              />
            </div>
          </div>
        );

      case 'planning':
        return (
          <div className="h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Plot Outline</h2>
              <Button>
                <Plus size={14} className="mr-1" />
                Add Scene
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedChapter?.scenes?.map((scene, i) => (
                <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{scene.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{scene.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      
      case 'formatting':
        return (
          <div className="h-full p-6">
            <h2 className="text-xl font-semibold mb-6">Format Preview</h2>
            <div className="bg-white border rounded-lg p-8 shadow-sm max-w-2xl mx-auto">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-center mb-8">Chapter 1</h1>
                <h2 className="text-lg font-semibold mb-4">The Beginning</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>The morning sun filtered through the curtains, casting long shadows across the hardwood floor. Sarah sat at her desk, fingers hovering over the keyboard, waiting for inspiration to strike.</p>
                  <p>It had been three months since her last published work, and the pressure from her editor was mounting. The blank page seemed to mock her, its pristine whiteness a stark reminder of her creative drought.</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'editing':
        return (
          <div className="h-full p-6">
            <h2 className="text-xl font-semibold mb-6">Track Changes</h2>
            <div className="bg-muted/30 rounded-lg p-6">
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The morning sun filtered through the curtains, casting long shadows across the 
                  <span className="bg-red-100 line-through mx-1">hardwood</span>
                  <span className="bg-green-100 mx-1">polished oak</span>
                  floor. Sarah sat at her desk, fingers hovering over the keyboard, waiting for inspiration to strike.
                </p>
                <p className="text-sm leading-relaxed">
                  <span className="bg-yellow-100">It had been three months since her last published work, and the pressure from her editor was mounting.</span>
                  <span className="ml-2 text-xs text-blue-600 cursor-pointer">[Comment: Consider shortening this sentence - Alex]</span>
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'reviewing':
        return (
          <div className="h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Review Mode</h2>
              <div className="text-sm text-muted-foreground">Read-only access</div>
            </div>
            <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-sm">
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">Chapter 1: The Beginning</h1>
                <div className="space-y-4 text-base leading-relaxed">
                  <p>The morning sun filtered through the curtains, casting long shadows across the hardwood floor. Sarah sat at her desk, fingers hovering over the keyboard, waiting for inspiration to strike.</p>
                  <p>It had been three months since her last published work, and the pressure from her editor was mounting. The blank page seemed to mock her, its pristine whiteness a stark reminder of her creative drought.</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to AuthorStudio</h2>
              <p className="text-muted-foreground">Select a mode to get started</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-background">
      {renderContent()}
      
      {/* Chapter Link Modal */}
      <ChapterLinkModal
        isOpen={showChapterLinkModal}
        onClose={() => setShowChapterLinkModal(false)}
        onSave={handleChapterLinkSave}
        bookId={bookId}
        versionId={versionId}
        currentLinkedNodeId={selectedChapter?.linkedPlotNodeId || null}
        chapterTitle={selectedChapter?.title || 'Untitled Chapter'}
      />
    </div>
  );
};
