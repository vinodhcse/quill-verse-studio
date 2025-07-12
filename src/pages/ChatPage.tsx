import React, { useState } from 'react';
import RephraseComparisonModal from './RephraseComparisonModal';
import Header from '../components/Header';
import { text } from 'stream/consumers';
// Assuming you have a zustand store like this, otherwise use useState
// import { useStore } from '../hooks/useStore';

const ChatPage: React.FC = () => {
  // If you are using a Zustand store, uncomment the line below and remove the useState lines
  // const { textToRephrase, setTextToRephrase, isRephraseModalOpen, setIsRephraseModalOpen } = useStore();

  // If you are NOT using a Zustand store, keep these useState hooks:
  const [textToRephrase, setTextToRephrase] = useState<string>('');
  const [isRephraseModalOpen, setIsRephraseModalOpen] = useState<boolean>(false);

  const handleOpenModal = () => {
    // Set the text you want to rephrase. This would typically come from your chat input.
    // For demonstration, I'm using the original text you provided.
    const sampleText = ``;
    console.log("Opening modal with text:", textToRephrase);
    //setTextToRephrase(sampleText);
    setIsRephraseModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRephraseModalOpen(false);
    setTextToRephrase(''); // Clear the text when the modal is closed
  };

  const handleCompleteRephrasing = (rephrasedContent: string) => {
    console.log("Rephrasing complete! Final Text:", rephrasedContent);
    // You would typically update your chat input or main text area here with the rephrasedContent
    setTextToRephrase(rephrasedContent); // For demonstration, update the text area with the rephrased text
    alert('Rephrasing complete! Check console for full text.');
  };

  return (
    <div className="p-8">
        
      <Header />
      <h1 className="text-3xl font-bold mb-6">Chat Page</h1>
      <textarea
        className="w-full p-4 border rounded-md min-h-[200px] mb-4"
        placeholder="Enter text to rephrase..."
        value={textToRephrase}
        onChange={(e) => setTextToRephrase(e.target.value)}
      ></textarea>
      <button
        onClick={handleOpenModal}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Open Rephrase Modal
      </button>

      {/* Render the modal conditionally */}
      {isRephraseModalOpen && textToRephrase && (
        <RephraseComparisonModal
          textToRephrase={textToRephrase}
          onClose={handleCloseModal}
          onCompleteRephrasing={handleCompleteRephrasing}
        />
      )}
    </div>
  );
};

export default ChatPage;