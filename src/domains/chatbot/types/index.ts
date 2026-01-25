// UI 컴포넌트용 타입

export type ChipType = string;

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'system' | 'form' | 'chips';
  chip_type?: string;
  form_data?: Record<string, any>;
  is_read?: boolean;
  is_submitted?: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'closed';
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChipButton {
  id?: string;
  type?: string;
  label: string;
  description?: string;
  form_config?: FormConfig;
}

export interface FormConfig {
  fields: FormField[];
  submit_label: string;
  success_message?: string;
}

export interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}
