import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchChapters, fetchSelectedChapter } from './bookService';
import { apiClient } from './api';

const initialState = {
  bookId: null,
  versionId: null,
  chapterId: null,
  chapters: [],
  authorId: null,
  selectedChapter: null,
  bookDetails: null,
  collaborators: [],
  plotCanvas: null,
  worlds: null,
  characters: [] 
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
    case 'SET_AUTHOR_ID':
      return { ...state, authorId: action.payload };
    case 'SET_BOOK_DETAILS':
      return { ...state, bookDetails: action.payload };
    case 'SET_COLLABORATORS':
      return { ...state, collaborators: action.payload };
    case 'SET_PLOTCANVAS':
      return { ...state, plotCanvas: action.payload };
    case 'SET_WORLDS':
      return { ...state, worlds: action.payload };
    case 'SET_CHARACTERS':
      return { ...state, characters: action.payload };
    default:
      return state;
  }
};

export const BookProvider = ({ children }) => {
  const { bookId, versionId } = useParams();
  const location = useLocation();
  const [state, dispatch] = useReducer(bookReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [plotCanvas, setPlotCanvas] = useState(null);
  const [worlds, setWorlds] = useState(null);
  const [characters, setCharacters] = useState([]);

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

  const fetchBookDetails = async () => {
    if (state.bookId) {
      try {
        const response = await apiClient.get(`/books/${state.bookId}`);
        dispatch({ type: 'SET_BOOK_DETAILS', payload: response.data });
        dispatch({ type: 'SET_COLLABORATORS', payload: response.data.collaborators || [] });
      } catch (error) {
        console.error('Failed to fetch book details:', error);
      }
    }
  };

  const fetchAllCharacters = async () => {
    if (state.bookId && state.versionId) {
      try {
        const response = await apiClient.get(`/books/${state.bookId}/versions/${state.versionId}/characters/all`);
        console.log('fetchAll characters', response);
        dispatch({ type: 'SET_CHARACTERS', payload: response.data || [] });
      } catch (error) {
        console.error('Failed to fetch characters:', error);
        setCharacters([]);
      }
    }
  };

  const fetchPlotCanvas = async () => {
    if (state.bookId && state.versionId) {
      try {
        const response = await apiClient.get(`/books/${state.bookId}/versions/${state.versionId}/plotCanvas`);
        console.log('fetchPlotCanvas response:', response);
        dispatch({ type: 'SET_PLOTCANVAS', payload: response.data || [] });
      } catch (error) {
        console.error('Failed to fetch PlotCanvas:', error);
        setPlotCanvas(null);
      }
    }
  };

  const fetchWorlds = async () => {
    if (state.bookId && state.versionId) {
      try {
        const response = await apiClient.get(`/books/${state.bookId}/versions/${state.versionId}/world/all`);
        console.log('fetchWorlds response:', response);
        dispatch({ type: 'SET_WORLDS', payload: response.data || [] });
      } catch (error) {
        console.error('Failed to fetch WorldBuilding:', error);
        setWorlds(null);
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

    fetchBookDetails();
    fetchPlotCanvas();
    fetchWorlds();
    fetchAllCharacters();
      
  }, [bookId, versionId, location.search]);


  useEffect(() => {
    console.log('Fetching book Details for bookId:', bookId, " versionId:", versionId);
    
    
    
    // Fetch book details including collaborators
    fetchBookDetails();
    fetchPlotCanvas();
    fetchWorlds();
    fetchAllCharacters();

    
      
  }, [bookId, versionId]);

  

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
    fetchBookDetails();
    fetchPlotCanvas();
    fetchWorlds();
    fetchAllCharacters();
  }, [state.bookId, state.versionId, state.chapterId]);

  return (
    <BookContext.Provider value={{ state, dispatch, refetchChapters, fetchBookDetails, plotCanvas, worlds, characters, loading }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBookContext = () => {
  return useContext(BookContext);
};
