'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatState, ChatConversation, ChatMessage, ChipButton, ChipType } from '../types';
import { createConversation, getConversations, updateConversation } from '../actions/conversationActions';
import { sendMessage, submitChatForm, deleteMessage, getMessages } from '../actions/messageActions';
import { getChatFlowResponse, processChatFlow, handleFormSubmission } from '../actions/chatFlowActions';
import { generateConversationTitle, CHIP_BUTTONS } from '../utils';
import { CHATBOT_MESSAGES } from '../constants/messages';

interface UseChatbotReturn {
  isOpen: boolean;
  currentView: 'chat' | 'conversations';
  activeConversation: string | null;
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  isTyping: boolean;
  currentForm: any;
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
  totalUnreadCount: number;
}

export function useChatbot(userId: string): UseChatbotReturn {
  const queryClient = useQueryClient();

  // 기본 UI 상태만 useState로 관리
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'conversations'>('conversations');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentForm, setCurrentForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [currentChipType, setCurrentChipType] = useState<ChipType | null>(null);

  // React Query로 대화 목록 조회 (데이터는 쿼리에서 직접 가져옴)
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['chatConversations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const result = await getConversations(userId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!userId && isOpen,
    staleTime: 30000,
  });

  // React Query로 현재 대화의 메시지 조회
  const { data: currentMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', activeConversation],
    queryFn: async () => {
      if (!activeConversation) return [];
      const result = await getMessages(activeConversation);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!activeConversation,
    staleTime: 10000,
  });

  // messages 객체를 useMemo로 안정적으로 생성
  const messages = useMemo(() => {
    if (!activeConversation) return {};
    return { [activeConversation]: currentMessages };
  }, [activeConversation, currentMessages]);

  // 대화 생성 mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const result = await createConversation(userId, title);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
      setActiveConversation(newConversation.id);
      setCurrentView('chat');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    },
  });

  // 메시지 전송 mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (params: {
      conversationId: string;
      content: string;
      type?: 'user' | 'bot' | 'system' | 'form' | 'chips';
      chipType?: ChipType;
      formData?: Record<string, any>;
    }) => {
      const result = await sendMessage(
        params.conversationId,
        params.content,
        params.type || 'user',
        params.chipType,
        params.formData
      );
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeConversation] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsTyping(false);
    },
  });

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    setError(null);
  }, []);

  const switchView = useCallback((view: 'chat' | 'conversations') => {
    setCurrentView(view);
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
    setCurrentView('chat');
  }, []);

  const startNewConversation = useCallback(async () => {
    const title = CHATBOT_MESSAGES.NEW_CONVERSATION;

    createConversationMutation.mutate(title, {
      onSuccess: async (newConversation) => {
        try {
          setIsTyping(true);

          // 1. 인사말 추가
          await sendMessageMutation.mutateAsync({
            conversationId: newConversation.id,
            content: CHATBOT_MESSAGES.GREETING,
            type: 'bot',
          });

          // 2. 칩 버튼 메시지 추가
          const allChips = CHIP_BUTTONS.map(chip => chip.label);
          await sendMessageMutation.mutateAsync({
            conversationId: newConversation.id,
            content: '',
            type: 'chips',
            formData: {
              showChips: true,
              chips: allChips
            }
          });

          setIsTyping(false);
        } catch (err) {
          console.error('Error adding initial greeting:', err);
          setIsTyping(false);
        }
      }
    });
  }, [createConversationMutation, sendMessageMutation]);

  const sendUserMessage = useCallback(async (message: string) => {
    if (!activeConversation) {
      const title = generateConversationTitle(message);
      createConversationMutation.mutate(title);
      return;
    }

    try {
      setIsTyping(true);

      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation,
        content: message,
        type: 'user',
      });

      const flowResult = await getChatFlowResponse(activeConversation, message);
      if (flowResult.success && flowResult.steps) {
        await processChatFlow(activeConversation, flowResult.steps);
        queryClient.invalidateQueries({ queryKey: ['chatMessages', activeConversation] });
      }

      if (message === CHATBOT_MESSAGES.COMPLETION_OKAY) {
        await updateConversation(activeConversation, { status: 'completed' });
        queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
      }

      setIsTyping(false);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(CHATBOT_MESSAGES.ERROR_MESSAGE_SEND_FAILED);
      setIsTyping(false);
    }
  }, [activeConversation, createConversationMutation, sendMessageMutation, queryClient, userId]);

  const handleChipClick = useCallback(async (chip: ChipButton | { label: string }) => {
    if (!activeConversation) return;

    if (!('type' in chip)) {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation,
        content: chip.label,
        type: 'user',
      });

      const flowResult = await getChatFlowResponse(activeConversation, chip.label);
      if (flowResult.success && flowResult.steps) {
        await processChatFlow(activeConversation, flowResult.steps);
        queryClient.invalidateQueries({ queryKey: ['chatMessages', activeConversation] });
      }
      return;
    }

    try {
      setIsTyping(true);
      setCurrentForm(null);
      setCurrentChipType(chip.type);

      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation,
        content: chip.label,
        type: 'user',
        chipType: chip.type,
      });

      const flowResult = await getChatFlowResponse(activeConversation, chip.label, chip.type);
      if (flowResult.success && flowResult.steps) {
        await processChatFlow(activeConversation, flowResult.steps);
        queryClient.invalidateQueries({ queryKey: ['chatMessages', activeConversation] });
      }

      if (chip.form_config) {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation,
          content: '',
          type: 'form',
          formData: chip.form_config,
        });
      }

      setIsTyping(false);
    } catch (err) {
      console.error('Error handling chip click:', err);
      setError(CHATBOT_MESSAGES.ERROR_REQUEST_FAILED);
      setIsTyping(false);
    }
  }, [activeConversation, sendMessageMutation, queryClient]);

  const handleFormSubmit = useCallback(async (formData: Record<string, any>) => {
    if (!activeConversation || !currentChipType) return;

    try {
      setIsFormSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await submitChatForm(
        activeConversation,
        '',
        userId,
        currentChipType,
        formData
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      await handleFormSubmission(activeConversation, currentChipType, formData);

      setCurrentChipType(null);
      setIsFormSubmitting(false);

      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeConversation] });
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(CHATBOT_MESSAGES.ERROR_FORM_SUBMIT_FAILED);
      setIsFormSubmitting(false);
    }
  }, [activeConversation, currentChipType, userId, queryClient]);

  const isLoading = conversationsLoading || messagesLoading ||
                   createConversationMutation.isPending ||
                   sendMessageMutation.isPending;

  // 읽지 않은 메시지 수 계산
  const totalUnreadCount = useMemo(() => {
    let count = 0;
    Object.values(messages).forEach(msgs => {
      count += msgs.filter(m => m.type === 'bot' && !m.is_read).length;
    });
    return count;
  }, [messages]);

  return {
    isOpen,
    currentView,
    activeConversation,
    conversations,
    messages,
    isTyping,
    currentForm,
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
