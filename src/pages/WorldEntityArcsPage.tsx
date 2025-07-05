
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorldEntityArcCanvas from '@/components/WorldArcs/WorldEntityArcCanvas';
import { useBookContext } from '@/lib/BookContextProvider';

const WorldEntityArcsPage = () => {
  const { bookId, versionId } = useParams();
  const [searchParams] = useSearchParams();
  const worldEntityId = searchParams.get('worldEntityId');
  const worldEntityType = searchParams.get('worldEntityType') as 'location' | 'object';
  const activeTab = searchParams.get('tab') || 'location';
  
  const { state } = useBookContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/plan/book/${bookId}/version/${versionId}`}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Plan
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">World Entity Arcs</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location">Location Arcs</TabsTrigger>
            <TabsTrigger value="object">Object Arcs</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="mt-6">
            <div className="h-[600px] border rounded-lg">
              <WorldEntityArcCanvas
                entityType="location"
                bookId={bookId!}
                versionId={versionId!}
              />
            </div>
          </TabsContent>

          <TabsContent value="object" className="mt-6">
            <div className="h-[600px] border rounded-lg">
              <WorldEntityArcCanvas
                entityType="object"
                bookId={bookId!}
                versionId={versionId!}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorldEntityArcsPage;
