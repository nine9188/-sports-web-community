'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { CHIP_BUTTONS } from '../utils';

// ============ 타입 ============
interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'chips' | 'form';
  chip_type?: string;
  form_data?: Record<string, any>;
  created_at: string;
  is_read?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  status: 'active' | 'completed';
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

// ============ 유틸 ============
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const TYPING_DELAY = 1000;

// ============ 훅 ============
export function useSimpleChatbot() {
  // 상태
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'conversations'>('conversations');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // 큐 시스템 (순차 실행)
  const queueRef = useRef<Array<() => Promise<void>>>([]);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;

    isProcessingRef.current = true;
    while (queueRef.current.length > 0) {
      const task = queueRef.current.shift()!;
      await task();
    }
    isProcessingRef.current = false;
  }, []);

  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current.push(task);
    processQueue();
  }, [processQueue]);

  // ============ 헬퍼 함수 ============

  // 메시지 즉시 추가
  const addMessage = useCallback((convId: string, message: Message) => {
    setMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), message],
    }));
  }, []);

  // 타이핑 후 봇 메시지 추가
  const showTypingThenMessage = useCallback((convId: string, content: string): Promise<void> => {
    return new Promise(resolve => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(convId, {
          id: generateId(),
          content,
          type: 'bot',
          created_at: new Date().toISOString(),
          is_read: false,
        });
        resolve();
      }, TYPING_DELAY);
    });
  }, [addMessage]);

  // 타이핑 후 칩 추가
  const showTypingThenChips = useCallback((convId: string, formData: Record<string, any>): Promise<void> => {
    return new Promise(resolve => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(convId, {
          id: generateId(),
          content: '',
          type: 'chips',
          form_data: formData,
          created_at: new Date().toISOString(),
          is_read: false,
        });
        resolve();
      }, TYPING_DELAY);
    });
  }, [addMessage]);

  // 타이핑 후 폼 추가
  const showTypingThenForm = useCallback((convId: string, chipType: string, formConfig: any): Promise<void> => {
    return new Promise(resolve => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(convId, {
          id: generateId(),
          content: '',
          type: 'form',
          chip_type: chipType,
          form_data: formConfig,
          created_at: new Date().toISOString(),
          is_read: false,
        });
        resolve();
      }, TYPING_DELAY);
    });
  }, [addMessage]);

  // 칩 비활성화 (선택된 라벨 표시)
  const disableChips = useCallback((convId: string, selectedLabel: string) => {
    setMessages(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).map(msg =>
        msg.type === 'chips' && !msg.form_data?.is_clicked
          ? { ...msg, form_data: { ...msg.form_data, is_clicked: true, selected_label: selectedLabel } }
          : msg
      ),
    }));
  }, []);

  // 대화 완료 처리
  const completeConversation = useCallback((convId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, status: 'completed' as const } : c
    ));
  }, []);

  // ============ 기본 액션 ============

  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);
  const switchView = useCallback((view: 'chat' | 'conversations') => setCurrentView(view), []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversation(id);
    setCurrentView('chat');
  }, []);

  // ============ 새 대화 시작 ============
  const startNewConversation = useCallback(() => {
    const now = new Date().toISOString();
    const convId = generateId();

    // 대화 생성
    setConversations(prev => [{
      id: convId,
      title: '새로운 대화',
      status: 'active',
      last_message_at: now,
      created_at: now,
      updated_at: now,
    }, ...prev]);

    setMessages(prev => ({ ...prev, [convId]: [] }));
    setActiveConversation(convId);
    setCurrentView('chat');

    // 흐름: 타이핑 → 안녕하세요 → 타이핑 → 칩
    enqueue(() => showTypingThenMessage(convId, '안녕하세요! 무엇을 도와드릴까요?'));
    enqueue(() => showTypingThenChips(convId, { showChips: true, chips: CHIP_BUTTONS.map(c => c.label) }));
  }, [enqueue, showTypingThenMessage, showTypingThenChips]);

  // ============ 메시지 전송 ============
  const sendUserMessage = useCallback((content: string) => {
    if (!activeConversation || !content.trim()) return;
    const convId = activeConversation;

    // 사용자 메시지 즉시
    addMessage(convId, {
      id: generateId(),
      content,
      type: 'user',
      created_at: new Date().toISOString(),
    });

    // 흐름: 타이핑 → 봇 응답
    enqueue(() => showTypingThenMessage(convId, `"${content}"에 대해 문의해주셨네요.`));
  }, [activeConversation, addMessage, enqueue, showTypingThenMessage]);

  // ============ 칩 클릭 ============
  const handleChipClick = useCallback((chip: { label: string; type?: string }) => {
    if (!activeConversation) return;
    const convId = activeConversation;

    // 칩 비활성화 + 사용자 메시지 즉시
    disableChips(convId, chip.label);
    addMessage(convId, {
      id: generateId(),
      content: chip.label,
      type: 'user',
      chip_type: chip.type,
      created_at: new Date().toISOString(),
    });

    // 1) "괜찮아요" → 타이핑 → 종료 메시지 → 대화 완료
    if (chip.label === '괜찮아요') {
      enqueue(async () => {
        await showTypingThenMessage(convId, '감사합니다. 다른 문의사항이 있으시면 새 대화를 시작해주세요.');
        completeConversation(convId);
      });
      return;
    }

    // 2) "다른문의" → 타이핑 → 메시지 → 타이핑 → 칩
    if (chip.label.includes('다른문의')) {
      enqueue(() => showTypingThenMessage(convId, '무엇을 도와드릴까요?'));
      enqueue(() => showTypingThenChips(convId, { showChips: true, chips: CHIP_BUTTONS.map(c => c.label) }));
      return;
    }

    // 3) 일반 칩 → 타이핑 → 설명 → 타이핑 → 폼
    const chipData = CHIP_BUTTONS.find(c => c.type === chip.type);
    if (chipData) {
      enqueue(() => showTypingThenMessage(convId, chipData.description));
      if (chipData.form_config) {
        enqueue(() => showTypingThenForm(convId, chip.type!, chipData.form_config));
      }
    }
  }, [activeConversation, disableChips, addMessage, enqueue, showTypingThenMessage, showTypingThenChips, showTypingThenForm, completeConversation]);

  // ============ 폼 제출 ============
  const handleFormSubmit = useCallback((formData: Record<string, any>) => {
    if (!activeConversation) return;
    const convId = activeConversation;

    // 폼 제출 완료 표시 + 입력된 데이터 저장 (즉시)
    setMessages(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).map(msg =>
        msg.type === 'form' && !msg.form_data?.is_submitted
          ? { ...msg, form_data: { ...msg.form_data, is_submitted: true, submitted_data: formData } }
          : msg
      ),
    }));

    // 흐름: 타이핑 → 접수 메시지 → 타이핑 → 추가문의 메시지 → 타이핑 → 칩
    enqueue(() => showTypingThenMessage(convId, '접수되었습니다. 검토 후 처리해드리겠습니다.'));
    enqueue(() => showTypingThenMessage(convId, '더 도움이 필요하신가요?'));
    enqueue(() => showTypingThenChips(convId, { showCompletion: true }));
  }, [activeConversation, enqueue, showTypingThenMessage, showTypingThenChips]);

  // ============ 메시지 읽음 처리 ============
  const markMessageAsRead = useCallback((messageId: string) => {
    if (!activeConversation) return;
    const convId = activeConversation;

    setMessages(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ),
    }));
  }, [activeConversation]);

  // 전체 안읽은 메시지 수 계산
  const totalUnreadCount = useMemo(() => {
    let count = 0;
    Object.values(messages).forEach(convMessages => {
      convMessages.forEach(msg => {
        if (msg.type !== 'user' && msg.is_read === false) {
          count++;
        }
      });
    });
    return count;
  }, [messages]);

  // 대화별 안읽은 메시지 수 반환
  const getUnreadCount = useCallback((conversationId: string) => {
    const convMessages = messages[conversationId] || [];
    return convMessages.filter(msg => msg.type !== 'user' && msg.is_read === false).length;
  }, [messages]);

  // ============ 반환 ============
  return {
    // 상태
    isOpen,
    currentView,
    activeConversation,
    conversations,
    messages,
    isTyping,

    // 액션
    toggleChat,
    switchView,
    selectConversation,
    startNewConversation,
    sendUserMessage,
    handleChipClick,
    handleFormSubmit,
    markMessageAsRead,
    getUnreadCount,

    // UI 호환용
    currentForm: null,
    isLoading: false,
    isFormSubmitting: false,
    error: null,
    totalUnreadCount,
  };
}
