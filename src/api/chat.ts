export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  // Get Firebase user token
  const auth = (await import('firebase/auth')).getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export class ChatAPI {
  // Get all conversations for the current user
  static async getConversations(): Promise<Conversation[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get messages for a specific conversation
  static async getConversationMessages(conversationId: string): Promise<Message[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Create a new conversation
  static async createConversation(title = 'New Chat'): Promise<Conversation> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Send a message to a conversation (non-streaming)
  static async sendMessage(conversationId: string, message: string): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Send a message with streaming response
  static async sendMessageStream(
    conversationId: string, 
    message: string,
    onUserMessage?: (message: Message) => void,
    onAssistantMessageStart?: (messageId: string, timestamp: string) => void,
    onContent?: (content: string, messageId: string) => void,
    onEnd?: (messageId: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Authorization': authHeaders.Authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send streaming message: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }
    
    const decoder = new TextDecoder();
    
    try {
      let done = false;
      while (!done) {
        const { done: doneReading, value } = await reader.read();
        done = doneReading;
        if (done) break;
    
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
    
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
    
              switch (data.type) {
                case 'user_message':
                  onUserMessage?.(data.message);
                  break;
                case 'assistant_message_start':
                  onAssistantMessageStart?.(data.messageId, data.timestamp);
                  break;
                case 'content':
                  onContent?.(data.content, data.messageId);
                  break;
                case 'end':
                  onEnd?.(data.messageId);
                  break;
                case 'error':
                  onError?.(data.error);
                  break;
              }
            } catch (e) {
              console.error('Failed to parse streaming data:', e);
            }
          }
        }
      }
    }  finally {
      reader.releaseLock();
    }
  }

  // Delete a conversation
  static async deleteConversation(conversationId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
  }

  // Clear all messages from a conversation
  static async clearConversation(conversationId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/clear`, {
      method: 'PUT',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear conversation: ${response.statusText}`);
    }
  }
} 