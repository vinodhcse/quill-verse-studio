import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Upload, GripVertical } from 'lucide-react';

interface ChapterContextMenuProps {
  children: React.ReactNode;
  onCreateChapter?: () => void;
  onImportChapters?: (file: File) => void;
}

export const ChapterContextMenu: React.FC<ChapterContextMenuProps> = ({
  children,
  onCreateChapter,
  onImportChapters,
}) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportChapters) {
      onImportChapters(file);
      setIsImportDialogOpen(false);
    }
  };

  const handleCreateChapter = () => {
    console.log('Creating a new chapter:', onCreateChapter)
    if (onCreateChapter) {
      onCreateChapter();
    }
    setChapterTitle('');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors">
            <Plus size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuItem onSelect={handleCreateChapter}>
            <Plus size={16} className="mr-2" />
            Create new chapter
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsImportDialogOpen(true)}>
            <Upload size={16} className="mr-2" />
            Import chapters from document
          </DropdownMenuItem>
          <DropdownMenuItem>
            <GripVertical size={16} className="mr-2" />
            Reorder chapters
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText size={16} className="mr-2" />
            Chapter settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Chapters from Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a document file to import chapters. Supported formats: .docx, .txt, .pdf
            </p>
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                accept=".docx,.txt,.pdf,.doc"
                onChange={handleFileUpload}
                className="hidden"
                id="chapter-import-upload"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('chapter-import-upload')?.click()}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
