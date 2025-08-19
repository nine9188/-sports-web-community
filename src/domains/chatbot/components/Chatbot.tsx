'use client';

import { useChatbot } from '../hooks/useChatbot';
import { useReadStatus } from '../hooks/useReadStatus';
import { ChatFloatingButton } from './ChatFloatingButton';
import { ChatModal } from './ChatModal';
import { ChatHeader } from './ChatHeader';
import { ChatConversationList } from './ChatConversationList';
import { ChatMessageList } from './ChatMessageList';
import { ChatChipButtons, SingleChipButton } from './ChatChipButtons';
import { ChatFormRenderer } from './ChatFormRenderer';
import { ChatInput } from './ChatInput';
import { cn } from '@/shared/utils/cn';

interface ChatbotProps {
  userId: string;
}

export function Chatbot({ userId }: ChatbotProps) {
  const chatbot = useChatbot(userId);
  const readStatus = useReadStatus(userId);

  const activeConversation = chatbot.conversations.find(
    conv => conv.id === chatbot.activeConversation
  );

  const currentMessages = chatbot.activeConversation 
    ? chatbot.messages[chatbot.activeConversation] || []
    : [];

  // Calculate total unread count
  const totalUnreadCount = chatbot.conversations.reduce((total, conv) => {
    return total + readStatus.getUnreadCount(conv.id);
  }, 0);

  const handleMessageRead = (messageId: string) => {
    if (chatbot.activeConversation) {
      readStatus.markAsRead(messageId, chatbot.activeConversation);
    }
  };

  const renderChatContent = () => {
    if (chatbot.currentView === 'conversations') {
      return (
        <ChatConversationList
          conversations={chatbot.conversations}
          onConversationSelect={chatbot.selectConversation}
          activeConversationId={chatbot.activeConversation || undefined}
          isLoading={chatbot.isLoading}
        />
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
        />

        {/* Chat Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {/* Show initial chips or form */}
          {chatbot.currentForm ? (
            <ChatFormRenderer
              formConfig={chatbot.currentForm}
              onSubmit={chatbot.handleFormSubmit}
              isSubmitting={chatbot.isLoading}
            />
          ) : currentMessages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center text-gray-600 text-sm mb-4">
                무엇을 도와드릴까요?
              </div>
              <ChatChipButtons
                onChipClick={chatbot.handleChipClick}
                disabled={chatbot.isTyping || chatbot.isLoading}
              />
            </div>
          ) : (
            // Show completion buttons after form submission
            currentMessages.length > 0 && 
            currentMessages[currentMessages.length - 1]?.content.includes('더 도와드릴게 있을까요?') && (
              <div className="flex space-x-2 justify-center">
                <SingleChipButton
                  label="괜찮아요"
                  onClick={() => chatbot.sendUserMessage('괜찮아요')}
                  disabled={chatbot.isTyping || chatbot.isLoading}
                />
                <SingleChipButton
                  label="네 다른문의 할게요"
                  onClick={() => chatbot.sendUserMessage('네 다른문의 할게요')}
                  disabled={chatbot.isTyping || chatbot.isLoading}
                  variant="primary"
                />
              </div>
            )
          )}
        </div>

        {/* Chat Input */}
        {!chatbot.currentForm && (
          <ChatInput
            onSendMessage={chatbot.sendUserMessage}
            disabled={chatbot.isTyping || chatbot.isLoading}
            placeholder="메시지를 입력하세요..."
          />
        )}
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
      </ChatModal>
    </>
  );
}