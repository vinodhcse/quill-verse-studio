import { apiClient } from './api';

export const fetchChapters = async (bookId: string, versionId: string) => {
  try {
    const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/chapters`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
};

export const fetchSelectedChapter = async (bookId: string, versionId: string, chapterId: string) => {
  try {
    const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching selected chapter:', error);
    return null;
  }
};
