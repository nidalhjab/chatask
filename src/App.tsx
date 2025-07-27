import  { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import AuthProvider from './components/AuthProvider';
import { initializeFirebase } from './config/firebase';
import { AuthContextProvider } from './contexts/AuthContext';
import { ChatContextProvider } from './contexts/ChatContext';
import { cleanFirebaseError } from './utils/errorUtils';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFirebase();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Firebase:', cleanFirebaseError(error));
        // Continue without Firebase for demo purposes
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700">
        <div className="mb-4">
          <div className="w-8 h-8 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
        </div>
        <p>Initializing ChatGPT-Style App...</p>
      </div>
    );
  }

  return (
    <AuthContextProvider>
      <ChatContextProvider>
        <div className="h-screen bg-gray-50 flex flex-col">
          <AuthProvider>
            <div className="flex h-screen">
              <Sidebar />
              <ChatInterface />
            </div>
          </AuthProvider>
        </div>
      </ChatContextProvider>
    </AuthContextProvider>
  );
}

export default App;
