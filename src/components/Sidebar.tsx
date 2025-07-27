import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import { useSignOut } from '../api/auth';

// Simple icon components (will be replaced with lucide-react after npm install)
const PlusIcon = () => <span>+</span>;
const MessageIcon = () => <span>💬</span>;
const TrashIcon = () => <span>🗑️</span>;
const UserIcon = () => <span>👤</span>;
const LogoutIcon = () => <span>🚪</span>;
const LoginIcon = () => <span>🔐</span>;

const Sidebar: React.FC = () => {
  const { 
    conversations, 
    currentConversationId, 
    isLoadingConversations, 
    isLoadingMessages, 
    createNewConversation, 
    deleteConversation, 
    selectConversation 
  } = useChat();
  const { user } = useAuth();
  const logOutmutation =useSignOut()
  
  // State for delete confirmation modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    conversationId: string | null;
    conversationTitle: string;
  }>({
    isOpen: false,
    conversationId: null,
    conversationTitle: '',
  });

  // State for sign out confirmation modal
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);

  const handleNewChat = async () => {
    await createNewConversation();
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conversation = conversations.find(c => c.id === conversationId);
    setDeleteModalState({
      isOpen: true,
      conversationId,
      conversationTitle: conversation?.title || 'Conversation',
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.conversationId) {
      await deleteConversation(deleteModalState.conversationId);
    }
    setDeleteModalState({ isOpen: false, conversationId: null, conversationTitle: '' });
  };

  const handleCancelDelete = () => {
    setDeleteModalState({ isOpen: false, conversationId: null, conversationTitle: '' });
  };

  const handleSignOutClick = () => {
    setSignOutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    await logOutmutation.mutateAsync();
    setSignOutModalOpen(false);
  };

  const handleCancelSignOut = () => {
    setSignOutModalOpen(false);
  };

  const handleLoginClick = async () => {
    // Sign out anonymous user to go back to login screen
    await logOutmutation.mutateAsync();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-74 bg-gray-900 text-white flex flex-col h-screen border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <button 
          className="w-full py-3 px-4 bg-transparent border border-gray-700 text-white rounded-lg cursor-pointer flex items-center gap-2 transition-colors duration-200 text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNewChat}
          disabled={isLoadingConversations}
        >
          <PlusIcon />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingConversations && (
          <div className="flex justify-center items-center h-full">
            <p>Loading chats...</p>
          </div>
        )}
        {!isLoadingConversations && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
            <MessageIcon />
            <p>No conversations yet</p>
            <p className="text-xs">Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 cursor-pointer rounded-lg mb-1 transition-colors duration-200 group hover:bg-gray-700 ${
                currentConversationId === conversation.id ? 'bg-gray-800' : ''
              }`}
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                  {conversation.title}
                </div>
                {isLoadingMessages && currentConversationId === conversation.id ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin ml-2"></div>
                ) : (
                  <button
                    className="bg-none border-none text-gray-400 cursor-pointer p-1 rounded transition-all duration-200 hover:text-red-400 ml-2"
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    title="Delete conversation"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {formatDate(conversation.updatedAt)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
              <UserIcon />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {user.isAnonymous ? 'Anonymous User' : (user.email || user.displayName || 'User')}
              </div>
              <div className="text-xs text-gray-400">
                {user.isAnonymous ? 'Guest' : 'Signed In'}
              </div>
            </div>
            {user.isAnonymous ? (
              <button 
                className="bg-none border-none text-gray-400 cursor-pointer p-2 rounded transition-all duration-200 hover:text-white hover:bg-gray-700"
                onClick={handleLoginClick}
                title="Sign in"
              >
                <LoginIcon />
              </button>
            ) : (
              <button 
                className="bg-none border-none text-gray-400 cursor-pointer p-2 rounded transition-all duration-200 hover:text-white hover:bg-gray-700"
                onClick={handleSignOutClick}
                title="Sign out"
              >
                <LogoutIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete conversation confirmation modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${deleteModalState.conversationTitle}"? This action cannot be undone.`}
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Sign out confirmation modal */}
      <ConfirmModal
        isOpen={signOutModalOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to sign in again to access your conversations."
        confirmText="Yes"
        cancelText="No"
        confirmButtonClass="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />
    </div>
  );
};

export default Sidebar; 