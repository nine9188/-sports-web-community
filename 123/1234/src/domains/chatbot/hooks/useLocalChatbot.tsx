'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatState, ChatConversation, ChatMessage, ChipButton, ChipType } from '../types';
import { localChatStorage } from '../actions/localStorageActions';
import { getChatFlowResponse } from '../actions/chatFlowActions';
import { generateConversationTitle } from '../utils';

interface UseLocalChatbotReturn extends ChatState {
  toggleChat: () => void;
  switchView: (view: 'chat' | 'conversations') => void;
  selectConversation: (conversationId: string) => void;
  startNewConversation: () => void;
  sendUserMessage: (message: string) => Promise<void>;
  handleChipClick: (chip: ChipButton) => Promise<void>;
  handleFormSubmit: (formData: Record<string, any>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  totalUnreadCount: number;
}

export function useLocalChatbot(): UseLocalChatbotReturn {
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    currentView: 'conversations',
    activeConversation: null,
    conversations: [],
    messages: {},
    isTyping: false,
    currentForm: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [currentChipType, setCurrentChipType] = useState<ChipType | null>(null);

  // 데이터 로드
  const loadData = useCallback(() => {
    const conversations = localChatStorage.getConversations();
    const messages: Record<string, ChatMessage[]> = {};
    
    conversations.forEach(conv => {
      messages[conv.id] = localChatStorage.getMessages(conv.id);
    });

    setChatState(prev => ({
      ...prev,
      conversations,
      messages,
    }));
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
    setError(null);
  }, []);

  const switchView = useCallback((view: 'chat' | 'conversations') => {
    setChatState(prev => ({
      ...prev,
      currentView: view,
    }));
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setChatState(prev => ({
      ...prev,
      activeConversation: conversationId,
      currentView: 'chat',
    }));
  }, []);

  const addBotMessage = useCallback(async (conversationId: string, content: string, formData?: Record<string, any>) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const messageType = formData ? 'form' : 'bot';
        localChatStorage.addMessage(conversationId, content, messageType, undefined, formData);
        loadData(); // 메시지 추가 후 다시 로드
        resolve();
      }, 1000); // 1초 딜레이로 타이핑 효과
    });
  }, [loadData]);

  const startNewConversation = useCallback(async () => {
    const title = '새로운 대화';
    const conversation = localChatStorage.createConversation(title);
    
    // 로컬 스토리지에서 업데이트된 데이터 다시 로드
    loadData();
    
    setChatState(prev => ({
      ...prev,
      activeConversation: conversation.id,
      currentView: 'chat',
      currentForm: null, // 폼 초기화
      isTyping: false // 타이핑 상태 초기화
    }));

    // 초기 인사말과 칩 버튼 추가
    try {
      setChatState(prev => ({ ...prev, isTyping: true }));
      
      // 1. 인사말 추가
      await addBotMessage(conversation.id, '안녕하세요! 무엇을 도와드릴까요?');
      
      // 2. 칩버튼 메시지 추가
      localChatStorage.addMessage(conversation.id, '', 'chips', undefined, { showChips: true });
      loadData();
      
      setChatState(prev => ({ ...prev, isTyping: false }));
    } catch (error) {
      console.error('Error initializing new conversation:', error);
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  }, [addBotMessage, loadData]);

  const sendUserMessage = useCallback(async (message: string) => {
    if (!chatState.activeConversation) {
      // 새 대화 생성
      const title = generateConversationTitle(message);
      const conversation = localChatStorage.createConversation(title);
      
      // 로컬 스토리지에서 업데이트된 데이터 다시 로드
      loadData();
      
      setChatState(prev => ({
        ...prev,
        activeConversation: conversation.id,
        currentView: 'chat'
      }));
      
      // 사용자 메시지 추가
      localChatStorage.addMessage(conversation.id, message, 'user');
      loadData(); // 메시지 추가 후 다시 로드
      
      // 봇 응답 처리
      try {
        setChatState(prev => ({ ...prev, isTyping: true }));
        
        const flowResult = await getChatFlowResponse(conversation.id, message);
        if (flowResult.success && flowResult.steps) {
          for (const step of flowResult.steps) {
            if (step.type === 'message' && step.content) {
              await addBotMessage(conversation.id, step.content);
            }
          }
        }
        
        setChatState(prev => ({ ...prev, isTyping: false }));
      } catch (error) {
        console.error('Error processing bot response:', error);
        setError('메시지 처리 중 오류가 발생했습니다.');
        setChatState(prev => ({ ...prev, isTyping: false }));
      }
      
      return;
    }

    try {
      setChatState(prev => ({ ...prev, isTyping: true }));
      
      // 사용자 메시지 추가
      localChatStorage.addMessage(chatState.activeConversation, message, 'user');
      loadData();

      // 봇 응답 처리
      const flowResult = await getChatFlowResponse(chatState.activeConversation, message);
      if (flowResult.success && flowResult.steps) {
        for (const step of flowResult.steps) {
          if (step.type === 'message' && step.content) {
            await addBotMessage(chatState.activeConversation, step.content);
          }
        }
      }

      // "괜찮아요"라고 답했을 때 대화 완료 처리
      if (message === '괜찮아요') {
        localChatStorage.updateConversationStatus(chatState.activeConversation, 'completed');
        loadData();
      }
      
      // "네 다른문의 할게요"라고 답했을 때 칩버튼 다시 표시
      if (message === '네 다른문의 할게요') {
        localChatStorage.addMessage(chatState.activeConversation, '', 'chips', undefined, { showChips: true });
        loadData();
      }

      setChatState(prev => ({ ...prev, isTyping: false }));
    } catch (error) {
      console.error('Error sending message:', error);
      setError('메시지 전송에 실패했습니다.');
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  }, [chatState.activeConversation, addBotMessage, loadData]);

  const handleChipClick = useCallback(async (chip: ChipButton | { label: string }) => {
    if (!chatState.activeConversation) return;

    // completion 버튼 처리 (단순 텍스트 메시지)
    if (!('type' in chip)) {
      // 칩 버튼 메시지 제거 (completion chips)
      const messages = localChatStorage.getMessages(chatState.activeConversation);
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'chips' && messages[i].form_data?.showCompletion) {
          localChatStorage.removeMessage(chatState.activeConversation, messages[i].id);
          break;
        }
      }
      loadData();
      
      await sendUserMessage(chip.label);
      return;
    }

    try {
      setChatState(prev => ({ 
        ...prev, 
        isTyping: true,
        currentForm: null, // 폼 상태 초기화
      }));
      setCurrentChipType(chip.type);

      // 칩 버튼 메시지 제거 (가장 최근의 chips 타입 메시지)
      const messages = localChatStorage.getMessages(chatState.activeConversation);
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'chips') {
          localChatStorage.removeMessage(chatState.activeConversation, messages[i].id);
          break;
        }
      }

      // 사용자 선택 에코
      localChatStorage.addMessage(
        chatState.activeConversation, 
        chip.label, 
        'user', 
        chip.type
      );
      loadData();

      // 봇 응답
      const flowResult = await getChatFlowResponse(
        chatState.activeConversation, 
        chip.label, 
        chip.type
      );
      
      if (flowResult.success && flowResult.steps) {
        for (const step of flowResult.steps) {
          if (step.type === 'message' && step.content) {
            await addBotMessage(chatState.activeConversation, step.content);
          }
        }
      }

      // 폼이 있으면 폼 메시지 추가
      if (chip.form_config) {
        localChatStorage.addMessage(chatState.activeConversation, '', 'form', chip.type, chip.form_config);
        loadData();
      }

      setChatState(prev => ({ ...prev, isTyping: false }));
    } catch (error) {
      console.error('Error handling chip click:', error);
      setError('요청 처리에 실패했습니다.');
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  }, [chatState.activeConversation, addBotMessage, sendUserMessage, loadData]);

  const handleFormSubmit = useCallback(async (formData: Record<string, any>) => {
    if (!chatState.activeConversation || !currentChipType) return;

    try {
      setIsFormSubmitting(true);
      
      // 폼 제출 상태 업데이트
      localChatStorage.updateFormSubmissionStatus(chatState.activeConversation, currentChipType);
      
      // 잠깐 대기 (UI에서 로딩 상태 확인용)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 제출 완료 메시지들
      await addBotMessage(chatState.activeConversation, '신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.');
      await addBotMessage(chatState.activeConversation, '더 도와드릴게 있을까요?');

      // completion 칩버튼 메시지 추가
      localChatStorage.addMessage(chatState.activeConversation, '', 'chips', undefined, { showCompletion: true });
      loadData();

      setCurrentChipType(null);
      setIsFormSubmitting(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('폼 제출에 실패했습니다.');
      setIsFormSubmitting(false);
    }
  }, [chatState.activeConversation, currentChipType, addBotMessage, loadData]);

  const totalUnreadCount = localChatStorage.getTotalUnreadCount();

  return {
    ...chatState,
    toggleChat,
    switchView,
    selectConversation,
    startNewConversation,
    sendUserMessage,
    handleChipClick,
    handleFormSubmit,
    isLoading,
    isFormSubmitting,
    error,
    totalUnreadCount,
  };
}