'use client';

import { useEffect, useState, useRef } from 'react';
import { ChatModal } from './ChatModal';
import { ChatFloatingButton } from './ChatFloatingButton';
import { ChatHeader } from './ChatHeader';
import { ChatConversationList } from './ChatConversationList';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { useSimpleChatbot } from '../hooks/useSimpleChatbot';

export function UniversalChatbot() {
  const chatbot = useSimpleChatbot();
  const [launcherVisible, setLauncherVisible] = useState(false);

  const toggleChatRef = useRef(chatbot.toggleChat);
  const startNewConversationRef = useRef(chatbot.startNewConversation);
  const switchViewRef = useRef(chatbot.switchView);
  const selectConversationRef = useRef(chatbot.selectConversation);
  const isOpenRef = useRef(chatbot.isOpen);
  const conversationsRef = useRef(chatbot.conversations);

  toggleChatRef.current = chatbot.toggleChat;
  startNewConversationRef.current = chatbot.startNewConversation;
  switchViewRef.current = chatbot.switchView;
  selectConversationRef.current = chatbot.selectConversation;
  isOpenRef.current = chatbot.isOpen;
  conversationsRef.current = chatbot.conversations;

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<{ mode?: 'new' | 'list' | 'auto' }>;
      const mode = custom.detail?.mode || 'auto';

      setLauncherVisible(true);

      if (!isOpenRef.current) {
        toggleChatRef.current();
      }

      if (mode === 'new') {
        startNewConversationRef.current();
        switchViewRef.current('chat');
      } else if (mode === 'list') {
        switchViewRef.current('conversations');
      } else {
        const conversations = conversationsRef.current;
        if (!conversations || conversations.length === 0) {
          startNewConversationRef.current();
          switchViewRef.current('chat');
        } else {
          const activeConv = conversations.find((c: any) => c.status === 'active');
          if (activeConv) {
            selectConversationRef.current(activeConv.id);
            switchViewRef.current('chat');
          } else {
            switchViewRef.current('conversations');
          }
        }
      }
    };

    window.addEventListener('open-chatbot', handleOpen as EventListener);
    return () => {
      window.removeEventListener('open-chatbot', handleOpen as EventListener);
    };
  }, []);

  const currentMessages = chatbot.activeConversation
    ? chatbot.messages[chatbot.activeConversation] || []
    : [];

  const activeConversation = chatbot.conversations.find(
    (conv) => conv.id === chatbot.activeConversation
  );

  return (
    <>
      {launcherVisible && (
        <ChatFloatingButton
          onClick={chatbot.toggleChat}
          isOpen={chatbot.isOpen}
          unreadCount={chatbot.totalUnreadCount}
        />
      )}

      <ChatModal isOpen={chatbot.isOpen} onClose={chatbot.toggleChat}>
        <ChatHeader
          currentView={chatbot.currentView}
          onViewChange={chatbot.switchView}
          conversationTitle={activeConversation?.title}
          canGoBack={chatbot.currentView === 'chat' && chatbot.conversations.length > 0}
          onNewConversation={chatbot.startNewConversation}
        />

        {chatbot.currentView === 'conversations' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatConversationList
              conversations={chatbot.conversations}
              onConversationSelect={chatbot.selectConversation}
              activeConversationId={chatbot.activeConversation || undefined}
              isLoading={false}
              onNewConversation={chatbot.startNewConversation}
              getUnreadCount={chatbot.getUnreadCount}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatMessageList
              messages={currentMessages}
              isTyping={chatbot.isTyping}
              isLoading={false}
              onMessageRead={chatbot.markMessageAsRead}
              onFormSubmit={chatbot.handleFormSubmit}
              onChipClick={chatbot.handleChipClick}
              isFormSubmitting={false}
            />
            {activeConversation?.status !== 'completed' && (
              <ChatInput
                onSendMessage={chatbot.sendUserMessage}
                disabled={false}
                placeholder="메시지를 입력하세요..."
              />
            )}
            {activeConversation?.status === 'completed' && (
              <div className="p-4 border-t border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">대화가 종료되었습니다</p>
              </div>
            )}
          </div>
        )}

        {chatbot.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-300 dark:border-red-700">
            <div className="text-sm text-red-700 dark:text-red-300">{chatbot.error}</div>
          </div>
        )}
      </ChatModal>
    </>
  );
}
