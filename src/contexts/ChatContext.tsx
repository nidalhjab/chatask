import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { ChatAPI, Message, Conversation } from '../api/chat';

export type { Message, Conversation } from '../api/chat';

// Query Keys
export const QUERY_KEYS = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversations', id] as const,
  messages: (conversationId: string) => ['conversations', conversationId, 'messages'] as const,
};

interface ChatState {
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
}

interface ChatContextType {
  // State
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
  
  // Data from React Query
  conversations: Conversation[];
  isLoadingConversations: boolean;
  conversationsError: Error | null;
  
  // Current conversation data
  currentConversation: Conversation | null;
  currentMessages: Message[];
  isLoadingMessages: boolean;
  messagesError: Error | null;
  
  // Actions
  selectConversation: (conversationId: string | null) => void;
  createNewConversation: () => Promise<string>;
  sendMessage: (message: string, conversationId?: string) => Promise<void>;
  clearConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatContextProvider');
  }
  return context;
};

// Custom hooks for React Query operations
export const useConversations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: ChatAPI.getConversations,
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: conversationId ? QUERY_KEYS.messages(conversationId) : ['disabled'],
    queryFn: () => conversationId ? ChatAPI.getConversationMessages(conversationId) : Promise.resolve([]),
    enabled: !!user && !!conversationId,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (title?: string) => ChatAPI.createConversation(title),
    onSuccess: (newConversation) => {
      // Add the new conversation to the cache
      queryClient.setQueryData(QUERY_KEYS.conversations, (old: Conversation[] = []) => 
        [newConversation, ...old]
      );
      
      // Initialize empty messages for the new conversation
      queryClient.setQueryData(QUERY_KEYS.messages(newConversation.id), []);
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ChatAPI.deleteConversation,
    onSuccess: (_, conversationId) => {
      // Remove conversation from cache
      queryClient.setQueryData(QUERY_KEYS.conversations, (old: Conversation[] = []) =>
        old.filter(conv => conv.id !== conversationId)
      );
      
      // Remove messages cache for this conversation
      queryClient.removeQueries({ queryKey: QUERY_KEYS.messages(conversationId) });
    },
  });
};

export const useClearConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ChatAPI.clearConversation,
    onSuccess: (_, conversationId) => {
      // Clear messages in cache
      queryClient.setQueryData(QUERY_KEYS.messages(conversationId), []);
      
      // Update conversation in cache
      queryClient.setQueryData(QUERY_KEYS.conversations, (old: Conversation[] = []) =>
        old.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: [], title: 'New Chat', updatedAt: new Date().toISOString() }
            : conv
        )
      );
    },
  });
};

interface ChatContextProviderProps {
  children: ReactNode;
}

export const ChatContextProvider: React.FC<ChatContextProviderProps> = ({ children }) => {
  const [state, setState] = useState<ChatState>({
    currentConversationId: null,
    isStreaming: false,
    streamingMessageId: null,
    error: null,
  });
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // React Query hooks
  const { 
    data: conversations = [], 
    isLoading: isLoadingConversations, 
    error: conversationsError 
  } = useConversations();
  
  const { 
    data: currentMessages = [], 
    isLoading: isLoadingMessages, 
    error: messagesError 
  } = useConversationMessages(state.currentConversationId);
  
  const createConversationMutation = useCreateConversation();
  const deleteConversationMutation = useDeleteConversation();
  const clearConversationMutation = useClearConversation();
  
  // Auto-select first conversation when conversations load
  useEffect(() => {
    if (!user) {
      // Clear all cached data when user logs out
      queryClient.clear();
      setState(prev => ({ ...prev, currentConversationId: null }));
      return;
    }
    
    if (conversations.length > 0 && !state.currentConversationId) {
      setState(prev => ({ ...prev, currentConversationId: conversations[0].id }));
    }
  }, [conversations, state.currentConversationId, user, queryClient]);
  
  const selectConversation = useCallback((conversationId: string | null) => {
    setState(prev => ({ ...prev, currentConversationId: conversationId }));
  }, []);
  
  const createNewConversation = useCallback(async (): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated to create conversations');
    }
    
    const result = await createConversationMutation.mutateAsync('New Chat');
    setState(prev => ({ ...prev, currentConversationId: result.id }));
    return result.id;
  }, [user, createConversationMutation]);
  
  const addMessageToCache = useCallback((conversationId: string, message: Message) => {
    queryClient.setQueryData(QUERY_KEYS.messages(conversationId), (old: Message[] = []) => 
      [...old, message]
    );
    
    // Update conversation's updatedAt timestamp
    queryClient.setQueryData(QUERY_KEYS.conversations, (old: Conversation[] = []) =>
      old.map(conv => 
        conv.id === conversationId 
          ? { ...conv, updatedAt: new Date().toISOString() }
          : conv
      )
    );
  }, [queryClient]);
  
  const updateMessageInCache = useCallback((conversationId: string, messageId: string, content: string, append = false) => {
    queryClient.setQueryData(QUERY_KEYS.messages(conversationId), (old: Message[] = []) =>
      old.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: append ? msg.content + content : content }
          : msg
      )
    );
  }, [queryClient]);
  
  const sendMessage = useCallback(async (message: string, conversationId?: string): Promise<void> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'You must be logged in to send messages' }));
      return;
    }
    
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Create new conversation if none exists
      let currentConversationId = conversationId || state.currentConversationId;
      if (!currentConversationId) {
        currentConversationId = await createNewConversation();
      }
      
      // Use streaming API for better UX
      await ChatAPI.sendMessageStream(
        currentConversationId,
        message,
        // onUserMessage
        (userMessage: Message) => {
          addMessageToCache(currentConversationId!, userMessage);
        },
        // onAssistantMessageStart
        (messageId: string, timestamp: string) => {
          const assistantMessage: Message = {
            id: messageId,
            role: 'assistant',
            content: '',
            timestamp,
            isStreaming: true,
          };
          
          addMessageToCache(currentConversationId!, assistantMessage);
          
          setState(prev => ({
            ...prev,
            isStreaming: true,
            streamingMessageId: messageId,
          }));
        },
        // onContent
        (content: string, messageId: string) => {
          updateMessageInCache(currentConversationId!, messageId, content, true);
        },
        // onEnd
        (messageId: string) => {
          setState(prev => ({
            ...prev,
            isStreaming: false,
            streamingMessageId: null,
          }));
          
          // Mark message as no longer streaming
          queryClient.setQueryData(QUERY_KEYS.messages(currentConversationId!), (old: Message[] = []) =>
            old.map(msg => 
              msg.id === messageId 
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
          
          // Update conversation title if it's the first exchange
          const currentConversation = conversations.find(conv => conv.id === currentConversationId);
          if (currentConversation && currentMessages.length <= 1) { // Only user message exists
            const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
            
            queryClient.setQueryData(QUERY_KEYS.conversations, (old: Conversation[] = []) =>
              old.map(conv => 
                conv.id === currentConversationId 
                  ? { ...conv, title }
                  : conv
              )
            );
          }
        },
        // onError
        (error: string) => {
          console.error('Streaming error:', error);
          setState(prev => ({
            ...prev,
            error: 'Failed to send message. Please try again.',
            isStreaming: false,
            streamingMessageId: null,
          }));
        }
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to send message. Please try again.',
        isStreaming: false,
        streamingMessageId: null,
      }));
    }
  }, [user, state.currentConversationId, createNewConversation, addMessageToCache, updateMessageInCache, queryClient, conversations, currentMessages]);
  
  const clearConversation = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await clearConversationMutation.mutateAsync(conversationId);
    } catch (error) {
      console.error('Error clearing conversation:', error);
      setState(prev => ({ ...prev, error: 'Failed to clear conversation' }));
    }
  }, [clearConversationMutation]);
  
  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await deleteConversationMutation.mutateAsync(conversationId);
      
      // If we deleted the current conversation, select another one
      if (state.currentConversationId === conversationId) {
        const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
        setState(prev => ({
          ...prev,
          currentConversationId: remainingConversations.length > 0 ? remainingConversations[0].id : null,
        }));
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setState(prev => ({ ...prev, error: 'Failed to delete conversation' }));
    }
  }, [deleteConversationMutation, state.currentConversationId, conversations]);
  
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);
  
  // Get current conversation
  const currentConversation = state.currentConversationId 
    ? conversations.find(conv => conv.id === state.currentConversationId) || null
    : null;
  
  const value: ChatContextType = {
    // State
    currentConversationId: state.currentConversationId,
    isStreaming: state.isStreaming,
    streamingMessageId: state.streamingMessageId,
    error: state.error,
    
    // Data from React Query
    conversations,
    isLoadingConversations,
    conversationsError: conversationsError as Error | null,
    
    // Current conversation data
    currentConversation,
    currentMessages,
    isLoadingMessages,
    messagesError: messagesError as Error | null,
    
    // Actions
    selectConversation,
    createNewConversation,
    sendMessage,
    clearConversation,
    deleteConversation,
    setError,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 