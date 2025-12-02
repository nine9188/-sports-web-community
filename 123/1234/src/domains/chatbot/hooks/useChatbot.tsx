'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatState, ChatConversation, ChatMessage, ChipButton, ChipType } from '../types';
import { createConversation, getConversations, updateConversation } from '../actions/conversationActions';
import { sendMessage, submitChatForm, deleteMessage } from '../actions/messageActions';
import { getChatFlowResponse, processChatFlow, handleFormSubmission } from '../actions/chatFlowActions';
import { generateConversationTitle, generateConversationId } from '../utils';

interface UseChatbotReturn extends ChatState {
  toggleChat: () => void;
  switchView: (view: 'chat' | 'conversations') => void;
  selectConversation: (conversationId: string) => void;
  startNewConversation: () => void;
  sendUserMessage: (message: string) => Promise<void>;
  handleChipClick: (chip: ChipButton) => Promise<void>;
  handleFormSubmit: (formData: Record<string, any>) => Promise<void>;
  isLoading: boolean;
  isFormSubmitting: boolean;
  error: string | null;
}

export function useChatbot(userId: string): UseChatbotReturn {
  const queryClient = useQueryClient();
  
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
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [currentChipType, setCurrentChipType] = useState<ChipType | null>(null);

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['chatConversations', userId],
    queryFn: async () => {
      const result = await getConversations(userId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!userId && chatState.isOpen,
  });

  // Fetch messages for active conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', chatState.activeConversation],
    queryFn: async () => {
      if (!chatState.activeConversation) return [];
      const { getMessages } = await import('../actions/messageActions');
      const result = await getMessages(chatState.activeConversation);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!chatState.activeConversation,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const result = await createConversation(userId, title);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
      setChatState(prev => ({
        ...prev,
        activeConversation: newConversation.id,
        currentView: 'chat',
      }));
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to create conversation');
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      type = 'user',
      chipType,
      formData 
    }: {
      conversationId: string;
      content: string;
      type?: 'user' | 'bot' | 'system' | 'form';
      chipType?: ChipType;
      formData?: Record<string, any>;
    }) => {
      const result = await sendMessage(conversationId, content, type, chipType, formData);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatState.activeConversation] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setChatState(prev => ({ ...prev, isTyping: false }));
    },
  });

  // Update state when data changes
  useEffect(() => {
    if (conversationsData) {
      setChatState(prev => ({
        ...prev,
        conversations: conversationsData,
      }));
    }
  }, [conversationsData]);

  useEffect(() => {
    if (messagesData && chatState.activeConversation) {
      setChatState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [chatState.activeConversation!]: messagesData,
        },
      }));
    }
  }, [messagesData, chatState.activeConversation]);

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

  const startNewConversation = useCallback(async () => {
    const title = '새로운 대화';
    
    // 새 대화 생성 후 초기 인사말 추가
    createConversationMutation.mutate(title, {
      onSuccess: async (newConversation) => {
        // 초기 인사말 추가
        try {
          setChatState(prev => ({ ...prev, isTyping: true }));
          
          await sendMessageMutation.mutateAsync({
            conversationId: newConversation.id,
            content: '안녕하세요! 무엇을 도와드릴까요?',
            type: 'bot',
          });

          setChatState(prev => ({ ...prev, isTyping: false }));
        } catch (error) {
          console.error('Error adding initial greeting:', error);
          setChatState(prev => ({ ...prev, isTyping: false }));
        }
      }
    });
  }, [createConversationMutation, sendMessageMutation]);

  const sendUserMessage = useCallback(async (message: string) => {
    if (!chatState.activeConversation) {
      // Create new conversation first
      const title = generateConversationTitle(message);
      createConversationMutation.mutate(title);
      return;
    }

    try {
      setChatState(prev => ({ ...prev, isTyping: true }));
      
      // Send user message
      await sendMessageMutation.mutateAsync({
        conversationId: chatState.activeConversation,
        content: message,
        type: 'user',
      });

      // Get bot response
      const flowResult = await getChatFlowResponse(chatState.activeConversation, message);
      if (flowResult.success && flowResult.steps) {
        await processChatFlow(chatState.activeConversation, flowResult.steps);
      }

      // "괜찮아요"라고 답했을 때 대화 완료 처리
      if (message === '괜찮아요') {
        await updateConversation(chatState.activeConversation, { status: 'completed' });
        queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
      }

      setChatState(prev => ({ ...prev, isTyping: false }));
    } catch (error) {
      console.error('Error sending message:', error);
      setError('메시지 전송에 실패했습니다.');
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  }, [chatState.activeConversation, createConversationMutation, sendMessageMutation, queryClient, userId]);

  const handleChipClick = useCallback(async (chip: ChipButton | { label: string }) => {
    if (!chatState.activeConversation) return;

    // completion 버튼 처리 (단순 텍스트 메시지)
    if (!('type' in chip)) {
      // completion chips 메시지 제거
      const messages = chatState.messages[chatState.activeConversation] || [];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'chips' && messages[i].form_data?.showCompletion) {
          try {
            await deleteMessage(messages[i].id);
          } catch (error) {
            console.error('Error deleting completion chip message:', error);
          }
          break;
        }
      }

      await sendMessageMutation.mutateAsync({
        conversationId: chatState.activeConversation,
        content: chip.label,
        type: 'user',
      });

      // 봇 응답 처리
      const flowResult = await getChatFlowResponse(chatState.activeConversation, chip.label);
      if (flowResult.success && flowResult.steps) {
        await processChatFlow(chatState.activeConversation, flowResult.steps);
      }

      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatState.activeConversation] });
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
      const messages = chatState.messages[chatState.activeConversation] || [];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'chips') {
          try {
            await deleteMessage(messages[i].id);
          } catch (error) {
            console.error('Error deleting chip message:', error);
          }
          break;
        }
      }

      // Echo user selection
      await sendMessageMutation.mutateAsync({
        conversationId: chatState.activeConversation,
        content: chip.label,
        type: 'user',
        chipType: chip.type,
      });

      // Get bot response
      const flowResult = await getChatFlowResponse(
        chatState.activeConversation, 
        chip.label, 
        chip.type
      );
      
      if (flowResult.success && flowResult.steps) {
        await processChatFlow(chatState.activeConversation, flowResult.steps);
      }

      // 폼이 있으면 폼 메시지 추가
      if (chip.form_config) {
        await sendMessageMutation.mutateAsync({
          conversationId: chatState.activeConversation,
          content: '',
          type: 'form',
          formData: chip.form_config,
        });
      }

      setChatState(prev => ({ ...prev, isTyping: false }));
    } catch (error) {
      console.error('Error handling chip click:', error);
      setError('요청 처리에 실패했습니다.');
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  }, [chatState.activeConversation, sendMessageMutation]);

  const handleFormSubmit = useCallback(async (formData: Record<string, any>) => {
    if (!chatState.activeConversation || !currentChipType) return;

    try {
      setIsFormSubmitting(true);
      
      // 잠깐 대기 (UI에서 로딩 상태 확인용)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Submit form data
      const result = await submitChatForm(
        chatState.activeConversation,
        '', // We'll need to track message ID if needed
        userId,
        currentChipType,
        formData
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Handle form submission flow
      await handleFormSubmission(chatState.activeConversation, currentChipType, formData);

      setCurrentChipType(null);
      setIsFormSubmitting(false);

      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatState.activeConversation] });
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('폼 제출에 실패했습니다.');
      setIsFormSubmitting(false);
    }
  }, [chatState.activeConversation, currentChipType, userId, queryClient]);

  const isLoading = conversationsLoading || 
                   messagesLoading || 
                   createConversationMutation.isPending || 
                   sendMessageMutation.isPending;

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
  };
}