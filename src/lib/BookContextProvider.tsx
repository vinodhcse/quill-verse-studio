
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchChapters, fetchSelectedChapter } from './bookService';

const initialState = {
  bookId: null,
  versionId: null,
  chapterId: null,
  chapters: [],
  selectedChapter: null,
};

const BookContext = createContext(null);

const bookReducer = (state, action) => {
  switch (action.type) {
    case 'SET_BOOK':
      return { ...state, bookId: action.payload };
    case 'SET_VERSION':
      return { ...state, versionId: action.payload };
    case 'SET_CHAPTER':
      return { ...state, chapterId: action.payload };
    case 'SET_CHAPTERS':
      return { ...state, chapters: action.payload };
    case 'SET_SELECTED_CHAPTER':
      return { ...state, selectedChapter: action.payload };
    default:
      return state;
  }
};

export const BookProvider = ({ children }) => {
  const { bookId, versionId } = useParams();
  const location = useLocation();
  const [state, dispatch] = useReducer(bookReducer, initialState);
  const [loading, setLoading] = useState(false);

  const refetchChapters = async () => {
    if (state.bookId && state.versionId) {
      try {
        const chapters = await fetchChapters(state.bookId, state.versionId);
        const sortedChapters = chapters.sort((a, b) => a.position - b.position);
        dispatch({ type: 'SET_CHAPTERS', payload: sortedChapters || [] });
      } catch (error) {
        console.error('Failed to refetch chapters:', error);
        dispatch({ type: 'SET_CHAPTERS', payload: [] });
      }
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const chapterIdFromQuery = queryParams.get('chapterId');

    console.log('BookProvider - Extracted bookId:', bookId);
    console.log('BookProvider - Extracted versionId:', versionId);
    console.log('BookProvider - Extracted chapterId:', chapterIdFromQuery);

    if (bookId) dispatch({ type: 'SET_BOOK', payload: bookId });
    if (versionId) dispatch({ type: 'SET_VERSION', payload: versionId });
    if (chapterIdFromQuery) dispatch({ type: 'SET_CHAPTER', payload: chapterIdFromQuery });
  }, [bookId, versionId, location.search]);

  useEffect(() => {
    const fetchData = async () => {
      if (state.bookId && state.versionId) {
        try {
          const chapters = await fetchChapters(state.bookId, state.versionId);
          const sortedChapters = chapters.sort((a, b) => a.position - b.position);
          dispatch({ type: 'SET_CHAPTERS', payload: sortedChapters || [] });
          
          // If no chapter is selected and we have chapters, select the first one
          if (!state.chapterId && sortedChapters.length > 0) {
            const firstChapter = sortedChapters[0];
            dispatch({ type: 'SET_SELECTED_CHAPTER', payload: firstChapter });
            dispatch({ type: 'SET_CHAPTER', payload: firstChapter.id });
          }
        } catch (error) {
          console.error('Failed to fetch chapters:', error);
          dispatch({ type: 'SET_CHAPTERS', payload: [] });
        }
      }
    };

    fetchData();
  }, [state.bookId, state.versionId]);

  useEffect(() => {
    const fetchSelectedChapterData = async () => {
      if (state.chapterId && state.bookId && state.versionId) {
        setLoading(true);
        try {
          console.log('BookProvider - Fetching chapter:', state.chapterId);
          const selectedChapter = await fetchSelectedChapter(state.bookId, state.versionId, state.chapterId);
          console.log('BookProvider - Fetched chapter data:', selectedChapter);
          dispatch({ type: 'SET_SELECTED_CHAPTER', payload: selectedChapter });
        } catch (error) {
          console.error('Failed to fetch selected chapter:', error);
          dispatch({ type: 'SET_SELECTED_CHAPTER', payload: null });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSelectedChapterData();
  }, [state.chapterId, state.bookId, state.versionId]);

  return (
    <BookContext.Provider value={{ state, dispatch, refetchChapters, loading }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBookContext = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBookContext must be used within a BookProvider');
  }
  return context;
};
