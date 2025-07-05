import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from './api';

interface UserContextProps {
  userId: string | null;
  name: string | null;
  email: string | null;
  globalRole: string | null;
  isAuthenticated: boolean;
  phoneNumber: string | null;
  description: string | null;
  link: string | null;
  hideProfilePicture: boolean;
  settings: {
    aiSettings: {
      aiEnabled: boolean;
      features: { id: string; enabled: boolean;  label: string; prompt: string, llmModel: string; }[];
    };
    theme: {
      color: string;
      customColorHex: string;
    };
    collaboration: {
      copyAllowed: boolean;
      allowComments: boolean;
      allowSuggestions: boolean;
      allowTrackChanges: boolean;
    };
    advanced: {
      temperature: number;
      maxTokens: number;
      validationLevel: string;
      tonePreset: string;
      maxSentenceLength: string;
      vocabularyComplexity: string;
    };
  } | null;
  setUser: (user: Partial<UserContextProps>) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextProps>({
    userId: null,
    name: null,
    email: null,
    globalRole: null,
    isAuthenticated: false,
    phoneNumber: null,
    description: null,
    link: null,
    hideProfilePicture: false,
    settings: {
      aiSettings: {
        aiEnabled: true,
        features: [
          { id: 'rephrasing', enabled: true, label: 'Rephrasing', prompt: 'Rephrase the following text to be more concise and engaging.', llmModel: 'default' },
          { id: 'expanding', enabled: true, label: 'Expanding', prompt: 'Expand the following text with more details, inner monologue, and sensory imagery.', llmModel: 'default' },
          { id: 'concising', enabled: false, label: 'Concising', prompt: 'Shorten the following text with more details, inner monologue, and sensory imagery.', llmModel: 'default' },
          { id: 'generating', enabled: true, label: 'Generating new lines', prompt: 'Generate new lines based on the context provided.', llmModel: 'default' },
          { id: 'validation', enabled: true, label: 'Validation', prompt: 'Validate the following text for grammar, style, and coherence.', llmModel: 'default' },
          { id: 'planning', enabled: false, label: 'Auto-updating Planning Boards', prompt: 'Update the planning board with the latest context and details.', llmModel: 'default' },
          { id: 'suggestions', enabled: true, label: 'Auto-suggest Next Lines', prompt: 'Suggest the next lines based on the current context.', llmModel: 'default' },
        ],
      },
      theme: {
        color: 'blue',
        customColorHex: '#0000FF',
      },
      collaboration: {
        copyAllowed: true,
        allowComments: true,
        allowSuggestions: true,
        allowTrackChanges: false,
      },
      advanced: {
        temperature: 0.7,
        maxTokens: 1000,
        validationLevel: 'balanced',
        tonePreset: 'conversational',
        maxSentenceLength: 'medium',
        vocabularyComplexity: 'medium',
      },
    },
    setUser: (userData) => setUser((prev) => ({ ...prev, ...userData })),
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await apiClient.get(`/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser({
          userId: response.data.id,
          name: response.data.name,
          email: response.data.email,
          globalRole: response.data.globalRole,
          isAuthenticated: true,
          phoneNumber: response.data.phoneNumber || null,
          description: response.data.description || null,
          link: response.data.link || null, 
          hideProfilePicture: response.data.hideProfilePicture || false,
          settings: response.data.settings || {
            aiSettings: {
              aiEnabled: true,
              features: [
                { id: 'rephrasing', enabled: true, label: 'Rephrasing', prompt: 'Rephrase the following text to be more concise and engaging.', llmModel: 'default' },
                { id: 'expanding', enabled: true, label: 'Expanding', prompt: 'Expand the following text with more details, inner monologue, and sensory imagery.', llmModel: 'default' },
                { id: 'concising', enabled: false, label: 'Concising', prompt: 'Shorten the following text with more details, inner monologue, and sensory imagery.', llmModel: 'default' },
                { id: 'generating', enabled: true, label: 'Generating new lines', prompt: 'Generate new lines based on the context provided.', llmModel: 'default' },
                { id: 'validation', enabled: true, label: 'Validation', prompt: 'Validate the following text for grammar, style, and coherence.', llmModel: 'default' },
                { id: 'planning', enabled: false, label: 'Auto-updating Planning Boards', prompt: 'Update the planning board with the latest context and details.', llmModel: 'default' },
                { id: 'suggestions', enabled: true, label: 'Auto-suggest Next Lines', prompt: 'Suggest the next lines based on the current context.', llmModel: 'default' },
              ],
            },
            theme: {
              color: 'blue',
              customColorHex: '#0000FF',
            },
            collaboration: {
              copyAllowed: true,
              allowComments: true,
              allowSuggestions: true,
              allowTrackChanges: false,
            },
            advanced: {
              temperature: 0.7,
              maxTokens: 1000,
              validationLevel: 'balanced',
              tonePreset: 'conversational',
              maxSentenceLength: 'medium',
              vocabularyComplexity: 'medium',
            },
          },
          setUser: user.setUser,
        });
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await apiClient.post('/auth/refresh-token', null, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        localStorage.setItem('token', response.data.token);
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    };

    const interval = setInterval(refreshToken, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return {
    ...context,
    getUser: () => ({
      userId: context.userId,
      name: context.name,
      email: context.email,
      globalRole: context.globalRole,
      isAuthenticated: context.isAuthenticated,
      phoneNumber: context.phoneNumber,
      description: context.description,
      link: context.link,
      hideProfilePicture: context.hideProfilePicture,
    }),
  };
};
