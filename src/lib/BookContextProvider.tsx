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
        const sortedChapters = chapters.sort((a, b) => a.position - b.position); // Sort by position (asc)
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

    console.log('Extracted bookId:', bookId);
    console.log('Extracted versionId:', versionId);
    console.log('Extracted chapterId:', chapterIdFromQuery);

    if (bookId) dispatch({ type: 'SET_BOOK', payload: bookId });
    if (versionId) dispatch({ type: 'SET_VERSION', payload: versionId });
    if (chapterIdFromQuery) dispatch({ type: 'SET_CHAPTER', payload: chapterIdFromQuery });
  }, [bookId, versionId, location.search]);

  useEffect(() => {
    const fetchData = async () => {
      if (state.bookId && state.versionId) {
        try {
          const chapters = await fetchChapters(state.bookId, state.versionId);
          const sortedChapters = chapters.sort((a, b) => a.position - b.position); // Sort by position (asc)
          dispatch({ type: 'SET_CHAPTERS', payload: sortedChapters || [] });
          if (!state.chapterId && sortedChapters.length > 0) {
            dispatch({ type: 'SET_SELECTED_CHAPTER', payload: sortedChapters[0] });
          }
        } catch (error) {
          console.error('Failed to fetch chapters:', error);
          dispatch({ type: 'SET_CHAPTERS', payload: [] });
        }
      }

      if (state.chapterId && state.bookId && state.versionId) {
        setLoading(true);
        try {
          const selectedChapter = await fetchSelectedChapter(state.bookId, state.versionId, state.chapterId);
          dispatch({ type: 'SET_SELECTED_CHAPTER', payload: selectedChapter });
        } catch (error) {
          console.error('Failed to fetch selected chapter:', error);
          dispatch({ type: 'SET_SELECTED_CHAPTER', payload: null });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [state.bookId, state.versionId, state.chapterId]);

  return (
    <BookContext.Provider value={{ state, dispatch, refetchChapters, loading }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBookContext = () => {
  return useContext(BookContext);
};
