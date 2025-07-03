import React from 'react';
import { useParams } from 'react-router-dom';
import CharacterArcCanvas from '@/components/CharacterArc/CharacterArcCanvas';

const CharacterArcPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
console.log('CharacterArcPage mounted with bookId:', bookId, 'versionId:', versionId);
  return (
    <div className="h-screen">
      <CharacterArcCanvas bookId={bookId} versionId={versionId} />
    </div>
  );
};

export default CharacterArcPage;
