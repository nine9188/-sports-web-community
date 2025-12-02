'use client';

import { useEffect, useState } from 'react';
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

  // 전역 이벤트로 챗봇 열기
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<{ mode?: 'new' | 'list' | 'auto' }>;
      const mode = custom.detail?.mode || 'auto';
      if (!launcherVisible) {
        setLauncherVisible(true);
      }
      if (!chatbot.isOpen) {
        chatbot.toggleChat();
      }
      // 모드별 시작 상태
      if (mode === 'new') {
        chatbot.startNewConversation();
        chatbot.switchView('chat');
      } else if (mode === 'list') {
        chatbot.switchView('conversations');
      } else {
        // auto 규칙
        // 1) 대화가 하나도 없으면 새 대화 시작
        // 2) 진행중(active) 대화가 있으면 그 대화로 시작
        // 3) 진행중이 없고 완료된 대화만 있으면 목록으로
        const conversations = chatbot.conversations;
        if (!conversations || conversations.length === 0) {
          chatbot.startNewConversation();
          chatbot.switchView('chat');
        } else {
          const activeConv = conversations.find((c) => c.status === 'active');
          if (activeConv) {
            chatbot.selectConversation(activeConv.id);
            chatbot.switchView('chat');
          } else {
            chatbot.switchView('conversations');
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
  }, [chatbot, launcherVisible]);

  // 로딩 중이면 아무것도 렌더링하지 않음
  if (userLoading || !chatUser) {
    return null;
  }

  const activeConversation = chatbot.conversations.find(
    conv => conv.id === chatbot.activeConversation
  );

  const currentMessages = chatbot.activeConversation 
    ? chatbot.messages[chatbot.activeConversation] || []
    : [];

  // 읽지 않은 메시지 수 계산 (플로팅 버튼 배지)
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
          isFormSubmitting={(function () {
            type MaybeFormSubmitting = { isFormSubmitting: boolean };
            const guard = (obj: unknown): obj is MaybeFormSubmitting => {
              return !!obj && typeof (obj as Record<string, unknown>).isFormSubmitting === 'boolean';
            };
            return guard(chatbot) ? chatbot.isFormSubmitting : false;
          })()}
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