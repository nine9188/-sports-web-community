'use client';

import {
  ChatConversation,
  ChatMessage,
  LocalChatData,
  LocalSession,
  ChipType
} from '../types';
import {
  getLocalChatData,
  saveLocalChatData,
  createLocalSession,
  isSessionExpired,
  generateConversationId,
  generateMessageId
} from '../utils';

export class LocalChatStorage {
  private static instance: LocalChatStorage;
  private data: LocalChatData | null = null;

  static getInstance(): LocalChatStorage {
    if (!LocalChatStorage.instance) {
      LocalChatStorage.instance = new LocalChatStorage();
    }
    return LocalChatStorage.instance;
  }

  private constructor() {
    this.loadData();
  }

  private loadData() {
    const data = getLocalChatData();
    
    if (data && data.session) {
      // 세션이 만료되었는지 확인
      if (isSessionExpired(data.session.expires_at)) {
        this.clearData();
        this.initializeData();
      } else {
        this.data = data;
      }
    } else {
      this.initializeData();
    }
  }

  private initializeData() {
    this.data = {
      session: createLocalSession(),
      conversations: [],
      messages: {},
      readStatus: {}
    };
    this.saveData();
  }

  private saveData() {
    if (this.data) {
      saveLocalChatData(this.data);
    }
  }

  clearData() {
    this.data = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatbot_local_data');
    }
  }

  getSession(): LocalSession | null {
    return this.data?.session || null;
  }

  getConversations(): ChatConversation[] {
    const conversations = this.data?.conversations || [];
    // 최신 메시지 순으로 정렬 (최근 대화가 맨 위)
    return conversations.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }

  getMessages(conversationId: string): ChatMessage[] {
    return this.data?.messages[conversationId] || [];
  }

  createConversation(title: string): ChatConversation {
    if (!this.data) {
      this.initializeData();
    }

    const conversation: ChatConversation = {
      id: generateConversationId(),
      user_id: this.data!.session.id,
      title,
      status: 'active',
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data!.conversations.push(conversation);
    this.data!.messages[conversation.id] = [];
    this.saveData();

    return conversation;
  }

  addMessage(
    conversationId: string,
    content: string,
    type: 'user' | 'bot' | 'system' | 'form' | 'chips' = 'user',
    chipType?: ChipType,
    formData?: Record<string, unknown>
  ): ChatMessage {
    if (!this.data) {
      this.initializeData();
    }

    const message: ChatMessage = {
      id: generateMessageId(),
      conversation_id: conversationId,
      type,
      content,
      chip_type: chipType,
      form_data: formData,
      is_read: type === 'user', // 사용자 메시지는 자동으로 읽음 처리
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!this.data!.messages[conversationId]) {
      this.data!.messages[conversationId] = [];
    }

    this.data!.messages[conversationId].push(message);

    // 대화의 마지막 메시지 시간 업데이트
    const conversation = this.data!.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.last_message_at = message.created_at;
      conversation.updated_at = message.created_at;
    }

    this.saveData();
    return message;
  }

  removeMessage(conversationId: string, messageId: string): void {
    if (!this.data || !this.data.messages[conversationId]) return;

    this.data.messages[conversationId] = this.data.messages[conversationId].filter(
      msg => msg.id !== messageId
    );
    this.saveData();
  }

  updateFormSubmissionStatus(conversationId: string, chipType: ChipType): void {
    if (!this.data || !this.data.messages[conversationId]) return;

    // 해당 chip_type의 form 메시지를 찾아서 submitted 상태로 변경
    const messages = this.data.messages[conversationId];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'form' && messages[i].chip_type === chipType) {
        messages[i].is_submitted = true;
        messages[i].updated_at = new Date().toISOString();
        break;
      }
    }
    this.saveData();
  }

  updateConversationStatus(conversationId: string, status: 'active' | 'completed' | 'closed'): void {
    if (!this.data) return;

    const conversation = this.data.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.status = status;
      conversation.updated_at = new Date().toISOString();
      this.saveData();
    }
  }

  markMessageAsRead(messageId: string): void {
    if (!this.data) return;

    // 모든 대화에서 해당 메시지 찾기
    for (const conversationId in this.data.messages) {
      const messages = this.data.messages[conversationId];
      const message = messages.find(m => m.id === messageId);
      
      if (message) {
        message.is_read = true;
        message.updated_at = new Date().toISOString();
        this.data.readStatus[messageId] = true;
        this.saveData();
        break;
      }
    }
  }

  markConversationAsRead(conversationId: string): void {
    if (!this.data || !this.data.messages[conversationId]) return;

    this.data.messages[conversationId].forEach(message => {
      if (!message.is_read) {
        message.is_read = true;
        message.updated_at = new Date().toISOString();
        this.data!.readStatus[message.id] = true;
      }
    });

    this.saveData();
  }

  getUnreadCount(conversationId: string): number {
    if (!this.data || !this.data.messages[conversationId]) return 0;

    return this.data.messages[conversationId].filter(
      message => !message.is_read && message.type === 'bot'
    ).length;
  }

  getTotalUnreadCount(): number {
    if (!this.data) return 0;

    let total = 0;
    for (const conversationId in this.data.messages) {
      total += this.getUnreadCount(conversationId);
    }
    return total;
  }

  updateConversation(
    conversationId: string, 
    updates: Partial<Pick<ChatConversation, 'title' | 'status'>>
  ): ChatConversation | null {
    if (!this.data) return null;

    const conversation = this.data.conversations.find(c => c.id === conversationId);
    if (!conversation) return null;

    Object.assign(conversation, updates, {
      updated_at: new Date().toISOString()
    });

    this.saveData();
    return conversation;
  }

  deleteConversation(conversationId: string): boolean {
    if (!this.data) return false;

    const index = this.data.conversations.findIndex(c => c.id === conversationId);
    if (index === -1) return false;

    this.data.conversations.splice(index, 1);
    delete this.data.messages[conversationId];

    // 해당 대화의 모든 메시지 읽음 상태 삭제
    for (const messageId in this.data.readStatus) {
      const message = Object.values(this.data.messages)
        .flat()
        .find(m => m.id === messageId);
      
      if (!message) {
        delete this.data.readStatus[messageId];
      }
    }

    this.saveData();
    return true;
  }
}

// 싱글톤 인스턴스 export
export const localChatStorage = LocalChatStorage.getInstance();