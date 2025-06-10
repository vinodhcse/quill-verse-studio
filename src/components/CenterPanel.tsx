import React, { useState } from 'react';
import { Mode } from './ModeNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollaborativeRichTextEditor } from '@/components/CollaborativeRichTextEditor';
import { Plus, Mic, Save, Edit3, Image as ImageIcon } from 'lucide-react';

interface CenterPanelProps {
  mode: Mode;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({ mode }) => {
  const [content, setContent] = useState(`<h1>Chapter 1: The Beginning</h1><p>The morning sun filtered through the curtains, casting long shadows across the hardwood floor. Sarah sat at her desk, fingers hovering over the keyboard, waiting for inspiration to strike...</p><p>It had been three months since her last published work, and the pressure from her editor was mounting. The blank page seemed to mock her, its pristine whiteness a stark reminder of her creative drought.</p>`);
  const [chapterTitle, setChapterTitle] = useState('Chapter 1: The Beginning');
  const [chapterImage, setChapterImage] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setChapterImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
                  {chapterImage && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50">
                      <img 
                        src={chapterImage} 
                        alt="Chapter" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    {isEditingTitle ? (
                      <Input
                        value={chapterTitle}
                        onChange={(e) => setChapterTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingTitle(false);
                          }
                        }}
                        className="text-lg font-semibold"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-semibold">{chapterTitle}</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingTitle(true)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 size={12} />
                        </Button>
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="chapter-image-upload"
                          />
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => document.getElementById('chapter-image-upload')?.click()}
                            className="h-6 w-6 p-0"
                          >
                            <ImageIcon size={12} />
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">Last edited 5 minutes ago</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Mic size={14} className="mr-1" />
                  Dictate
                </Button>
                <Button variant="outline" size="sm">
                  <Save size={14} className="mr-1" />
                  Save
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <CollaborativeRichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your story..."
                className="h-full"
                blockId="block_001"
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
              {[
                { title: 'Opening Hook', content: 'Introduce Sarah in her apartment, struggling with writer\'s block' },
                { title: 'Inciting Incident', content: 'Discovery of the mysterious letter under her door' },
                { title: 'First Plot Point', content: 'Decision to investigate the letter\'s origins' },
                { title: 'Midpoint', content: 'Revelation about her family\'s secret past' },
                { title: 'Crisis', content: 'Confrontation with the antagonist' },
                { title: 'Climax', content: 'Final showdown and resolution' },
              ].map((scene, i) => (
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
    </div>
  );
};
