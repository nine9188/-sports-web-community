'use client';

import { useChatUser } from '../hooks/useChatUser';
import { useChatbot } from '../hooks/useChatbot';
import { useLocalChatbot } from '../hooks/useLocalChatbot';
import { useReadStatus } from '../hooks/useReadStatus';
import { ChatFloatingButton } from './ChatFloatingButton';
import { ChatModal } from './ChatModal';
import { ChatHeader } from './ChatHeader';
import { ChatConversationList } from './ChatConversationList';
import { ChatMessageList } from './ChatMessageList';
import { ChatChipButtons, SingleChipButton } from './ChatChipButtons';
import { ChatFormRenderer } from './ChatFormRenderer';
import { ChatInput } from './ChatInput';
import { localChatStorage } from '../actions/localStorageActions';

export function UniversalChatbot() {
  const { chatUser, isLoading: userLoading } = useChatUser();
  
  // 인증된 사용자용 훅
  const authenticatedChatbot = useChatbot(chatUser?.isAuthenticated ? chatUser.id : '');
  const readStatus = useReadStatus(chatUser?.isAuthenticated ? chatUser.id : '');
  
  // 로컬 사용자용 훅
  const localChatbot = useLocalChatbot();

  // 로딩 중이면 아무것도 렌더링하지 않음
  if (userLoading || !chatUser) {
    return null;
  }

  // 인증 상태에 따라 적절한 훅 선택
  const chatbot = chatUser.isAuthenticated ? authenticatedChatbot : localChatbot;

  const activeConversation = chatbot.conversations.find(
    conv => conv.id === chatbot.activeConversation
  );

  const currentMessages = chatbot.activeConversation 
    ? chatbot.messages[chatbot.activeConversation] || []
    : [];

  // 읽지 않은 메시지 수 계산
  const totalUnreadCount = chatUser.isAuthenticated 
    ? chatbot.conversations.reduce((total, conv) => {
        return total + readStatus.getUnreadCount(conv.id);
      }, 0)
    : localChatbot.totalUnreadCount;

  const handleMessageRead = (messageId: string) => {
    if (chatUser.isAuthenticated && chatbot.activeConversation) {
      readStatus.markAsRead(messageId, chatbot.activeConversation);
    } else {
      localChatStorage.markMessageAsRead(messageId);
    }
  };

  const renderChatContent = () => {
    if (chatbot.currentView === 'conversations') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatConversationList
            conversations={chatbot.conversations}
            onConversationSelect={chatbot.selectConversation}
            activeConversationId={chatbot.activeConversation || undefined}
            isLoading={chatbot.isLoading}
            onNewConversation={chatbot.startNewConversation}
          />
        </div>
      );
    }

    // Chat view
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <ChatMessageList
          messages={currentMessages}
          isTyping={chatbot.isTyping}
          isLoading={chatbot.isLoading}
          onMessageRead={handleMessageRead}
          onFormSubmit={chatbot.handleFormSubmit}
          onChipClick={chatbot.handleChipClick}
          isFormSubmitting={chatbot.isFormSubmitting}
        />


        {/* Chat Input */}
        <ChatInput
          onSendMessage={chatbot.sendUserMessage}
          disabled={chatbot.isTyping || chatbot.isLoading}
          placeholder="메시지를 입력하세요..."
        />
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <ChatFloatingButton
        onClick={chatbot.toggleChat}
        isOpen={chatbot.isOpen}
        unreadCount={totalUnreadCount}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatbot.isOpen}
        onClose={chatbot.toggleChat}
        chatState={chatbot}
      >
        {/* Header */}
        <ChatHeader
          currentView={chatbot.currentView}
          onViewChange={chatbot.switchView}
          conversationTitle={activeConversation?.title}
          canGoBack={chatbot.currentView === 'chat' && chatbot.conversations.length > 0}
          onNewConversation={chatbot.startNewConversation}
        />

        {/* Content */}
        {renderChatContent()}

        {/* Error Display */}
        {chatbot.error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="text-sm text-red-700">
              {chatbot.error}
            </div>
          </div>
        )}

        {/* User Status Indicator (개발용) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-gray-100 border-t text-xs text-gray-500 text-center">
            {chatUser.isAuthenticated ? '인증된 사용자' : '로컬 세션 사용자'} | ID: {chatUser.id}
          </div>
        )}
      </ChatModal>
    </>
  );
}