
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';

interface Version {
  id: string;
  name: string;
  type?: 'Manuscript' | 'Edition';
  status?: 'Draft' | 'Final' | 'Published';
}

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVersion: (versionData: { name: string; baseVersionId?: string }) => void;
  existingVersions?: Version[];
}

interface FormData {
  name: string;
  baseVersionId?: string;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  isOpen,
  onClose,
  onCreateVersion,
  existingVersions = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      name: 'Manuscript',
      baseVersionId: '',
    },
  });

  const onSubmit = async (data: FormData, e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      onCreateVersion({
        name: data.name,
        baseVersionId: data.baseVersionId || undefined,
      });
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Version name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter version name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {existingVersions.length > 0 && (
              <FormField
                control={form.control}
                name="baseVersionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Copy from Version (Optional)</FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => field.onChange(value)} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a version to copy from" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingVersions.map((version) => (
                            version.id && (
                              <SelectItem key={version.id} value={version.id}>
                                {version.name} ({version.status || 'Draft'})
                              </SelectItem>
                            )
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Version'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
