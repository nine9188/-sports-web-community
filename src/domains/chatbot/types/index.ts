export type ChatMessageType = 'user' | 'bot' | 'system' | 'form' | 'chips';

export type ChipType = 
  | 'community_inquiry'
  | 'community_terms'
  | 'member_report'
  | 'opinion_submit'
  | 'post_delete_request'
  | 'bug_report';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  type: ChatMessageType;
  content: string;
  chip_type?: ChipType;
  form_data?: Record<string, any>;
  is_submitted?: boolean; // 폼 제출 완료 상태
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  status: 'active' | 'completed' | 'closed';
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChipButton {
  id: string;
  type: ChipType;
  label: string;
  description: string;
  form_config?: FormConfig;
}

export interface FormConfig {
  fields: FormField[];
  submit_label: string;
  success_message: string;
}

export interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

export interface ChatState {
  isOpen: boolean;
  currentView: 'chat' | 'conversations';
  activeConversation: string | null;
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  isTyping: boolean;
  currentForm: FormConfig | null;
}

export interface MessageStatus {
  message_id: string;
  user_id: string;
  conversation_id: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// 로컬 세션 관련 타입
export interface LocalSession {
  id: string;
  created_at: string;
  expires_at: string;
}

export interface LocalChatData {
  session: LocalSession;
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  readStatus: Record<string, boolean>;
}

export interface ChatUser {
  id: string;
  isAuthenticated: boolean;
  isLocal: boolean;
}