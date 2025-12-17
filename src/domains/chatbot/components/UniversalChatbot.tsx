'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useChatUser } from '../hooks/useChatUser';
import { useChatbot } from '../hooks/useChatbot';
import { useLocalChatbot } from '../hooks/useLocalChatbot';
import { useReadStatus } from '../hooks/useReadStatus';
import { ChatModal } from './ChatModal';
import { ChatFloatingButton } from './ChatFloatingButton';
import { ChatHeader } from './ChatHeader';
import { ChatConversationList } from './ChatConversationList';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { localChatStorage } from '../actions/localStorageActions';

// Type guard helper function
function hasFormSubmitting(obj: any): obj is { isFormSubmitting: boolean } {
  return !!obj && typeof obj.isFormSubmitting === 'boolean';
}

export function UniversalChatbot() {
  const { chatUser, isLoading: userLoading } = useChatUser();

  // 인증된 사용자용 훅
  const authenticatedChatbot = useChatbot(chatUser?.isAuthenticated ? chatUser.id : '');
  const readStatus = useReadStatus(chatUser?.isAuthenticated ? chatUser.id : '');

  // 로컬 사용자용 훅
  const localChatbot = useLocalChatbot();

  // 인증 상태에 따라 적절한 훅 선택
  const chatbot = chatUser?.isAuthenticated ? authenticatedChatbot : localChatbot;

  // 문의하기 클릭 후 런처(플로팅 버튼) 노출 여부
  const [launcherVisible, setLauncherVisible] = useState(false);

  // Refs for chatbot functions to avoid re-registering event listener
  const toggleChatRef = useRef(chatbot.toggleChat);
  const startNewConversationRef = useRef(chatbot.startNewConversation);
  const switchViewRef = useRef(chatbot.switchView);
  const selectConversationRef = useRef(chatbot.selectConversation);
  const isOpenRef = useRef(chatbot.isOpen);
  const conversationsRef = useRef(chatbot.conversations);

  // Update refs when chatbot changes
  useEffect(() => {
    toggleChatRef.current = chatbot.toggleChat;
    startNewConversationRef.current = chatbot.startNewConversation;
    switchViewRef.current = chatbot.switchView;
    selectConversationRef.current = chatbot.selectConversation;
    isOpenRef.current = chatbot.isOpen;
    conversationsRef.current = chatbot.conversations;
  }, [chatbot]);

  // 전역 이벤트로 챗봇 열기
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<{ mode?: 'new' | 'list' | 'auto' }>;
      const mode = custom.detail?.mode || 'auto';

      setLauncherVisible(true);

      if (!isOpenRef.current) {
        toggleChatRef.current();
      }

      // 모드별 시작 상태
      if (mode === 'new') {
        startNewConversationRef.current();
        switchViewRef.current('chat');
      } else if (mode === 'list') {
        switchViewRef.current('conversations');
      } else {
        // auto 규칙
        // 1) 대화가 하나도 없으면 새 대화 시작
        // 2) 진행중(active) 대화가 있으면 그 대화로 시작
        // 3) 진행중이 없고 완료된 대화만 있으면 목록으로
        const conversations = conversationsRef.current;
        if (!conversations || conversations.length === 0) {
          startNewConversationRef.current();
          switchViewRef.current('chat');
        } else {
          const activeConv = conversations.find((c) => c.status === 'active');
          if (activeConv) {
            selectConversationRef.current(activeConv.id);
            switchViewRef.current('chat');
          } else {
            switchViewRef.current('conversations');
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('open-chatbot', handleOpen as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-chatbot', handleOpen as EventListener);
      }
    };
  }, []); // No dependencies - refs are always up to date

  // Memoized callbacks - MUST be before early return
  const handleMessageRead = useCallback((messageId: string) => {
    if (chatUser?.isAuthenticated && chatbot.activeConversation) {
      readStatus.markAsRead(messageId, chatbot.activeConversation);
    } else {
      localChatStorage.markMessageAsRead(messageId);
    }
  }, [chatUser?.isAuthenticated, chatbot.activeConversation, readStatus]);

  const currentMessages = chatbot.activeConversation
    ? chatbot.messages[chatbot.activeConversation] || []
    : [];

  const renderChatContent = useCallback(() => {
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
          isFormSubmitting={hasFormSubmitting(chatbot) ? chatbot.isFormSubmitting : false}
        />

        {/* Chat Input */}
        <ChatInput
          onSendMessage={chatbot.sendUserMessage}
          disabled={chatbot.isTyping || chatbot.isLoading}
          placeholder="메시지를 입력하세요..."
        />
      </div>
    );
  }, [
    chatbot.currentView,
    chatbot.conversations,
    chatbot.selectConversation,
    chatbot.activeConversation,
    chatbot.isLoading,
    chatbot.startNewConversation,
    chatbot.isTyping,
    chatbot.handleFormSubmit,
    chatbot.handleChipClick,
    chatbot.sendUserMessage,
    chatbot,
    currentMessages,
    handleMessageRead,
  ]);

  // 로딩 중이면 아무것도 렌더링하지 않음
  if (userLoading || !chatUser) {
    return null;
  }

  const activeConversation = chatbot.conversations.find(
    conv => conv.id === chatbot.activeConversation
  );

  // 읽지 않은 메시지 수 계산 (플로팅 버튼 배지)
  const totalUnreadCount = chatUser.isAuthenticated
    ? chatbot.conversations.reduce((total, conv) => {
        return total + readStatus.getUnreadCount(conv.id);
      }, 0)
    : localChatbot.totalUnreadCount;

  return (
    <>
      {/* Floating Button: 문의하기 클릭 후 노출 */}
      {launcherVisible && (
        <ChatFloatingButton
          onClick={chatbot.toggleChat}
          isOpen={chatbot.isOpen}
          unreadCount={totalUnreadCount}
        />
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatbot.isOpen}
        onClose={chatbot.toggleChat}
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
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-300 dark:border-red-700">
            <div className="text-sm text-red-700 dark:text-red-300">
              {chatbot.error}
            </div>
          </div>
        )}

        {/* User Status Indicator (개발용) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10 text-xs text-gray-700 dark:text-gray-300 text-center">
            {chatUser.isAuthenticated ? '인증된 사용자' : '로컬 세션 사용자'} | ID: {chatUser.id}
          </div>
        )}
      </ChatModal>
    </>
  );
}