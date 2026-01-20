'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { ChatMessage, ChipType } from '../types';

export async function sendMessage(
  conversationId: string,
  content: string,
  type: 'user' | 'bot' | 'system' | 'form' | 'chips' = 'user',
  chipType?: ChipType,
  formData?: Record<string, unknown>
): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const now = new Date().toISOString();

    // Insert message with correct field names matching the actual DB schema
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        type,
        content,
        chip_type: chipType || null,
        form_data: formData || null,
        is_read: type === 'user',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    // Update conversation's last_message_at
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: now, updated_at: now })
      .eq('id', conversationId);

    const chatMessage: ChatMessage = {
      id: data.id,
      conversation_id: data.conversation_id,
      type: data.type,
      content: data.content,
      chip_type: data.chip_type,
      form_data: data.form_data,
      is_read: data.is_read,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    // revalidatePath 제거 - 클라이언트에서 queryClient.invalidateQueries로 처리
    return { success: true, data: chatMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
}

export async function getMessages(
  conversationId: string
): Promise<{ success: boolean; data?: ChatMessage[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }

    // Transform database data to ChatMessage format (fields now match directly)
    const chatMessages: ChatMessage[] = (data || []).map((msg) => {
      const formData = msg.form_data as Record<string, unknown> | null;
      // is_submitted은 form_data 내에 저장되어 있음
      const isSubmitted = formData?.is_submitted === true || msg.is_submitted === true;

      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        type: msg.type,
        content: msg.content || '',
        chip_type: msg.chip_type,
        form_data: formData,
        is_submitted: isSubmitted,
        is_read: msg.is_read || false,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
      };
    });

    return { success: true, data: chatMessages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch messages'
    };
  }
}

export async function markMessageAsRead(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating message read status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark message as read'
    };
  }
}

export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete message'
    };
  }
}

export async function markChipsAsClicked(
  conversationId: string,
  messageId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();
    const now = new Date().toISOString();

    let targetMessageId = messageId;

    // messageId가 없으면 해당 대화의 가장 최근 chips 메시지를 찾음
    if (!targetMessageId) {
      const { data: chipsMessages } = await supabase
        .from('chat_messages')
        .select('id, form_data')
        .eq('conversation_id', conversationId)
        .eq('type', 'chips')
        .order('created_at', { ascending: false })
        .limit(1);

      if (chipsMessages && chipsMessages.length > 0) {
        const chipsMsg = chipsMessages[0];
        const existingFormData = chipsMsg.form_data as Record<string, unknown> | null;
        if (!existingFormData?.is_clicked) {
          targetMessageId = chipsMsg.id;
        }
      }
    }

    if (targetMessageId) {
      // 기존 form_data를 가져와서 is_clicked 추가
      const { data: msgData } = await supabase
        .from('chat_messages')
        .select('form_data')
        .eq('id', targetMessageId)
        .single();

      const existingFormData = (msgData?.form_data as Record<string, unknown>) || {};

      const { error } = await supabase
        .from('chat_messages')
        .update({
          form_data: { ...existingFormData, is_clicked: true },
          updated_at: now,
        })
        .eq('id', targetMessageId);

      if (error) {
        console.error('Error marking chips as clicked:', error);
        return { success: false, error: error.message };
      }
    }

    // revalidatePath 제거 - 클라이언트에서 queryClient.invalidateQueries로 처리
    return { success: true };
  } catch (error) {
    console.error('Error marking chips as clicked:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark chips as clicked'
    };
  }
}

export async function submitChatForm(
  conversationId: string,
  messageId: string,
  userId: string,
  formType: string,
  formData: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const now = new Date().toISOString();
    let targetMessageId = messageId;

    // messageId가 없으면 해당 대화의 가장 최근 form 메시지를 찾음
    if (!targetMessageId) {
      const { data: formMessages } = await supabase
        .from('chat_messages')
        .select('id, form_data')
        .eq('conversation_id', conversationId)
        .eq('type', 'form')
        .order('created_at', { ascending: false })
        .limit(1);

      if (formMessages && formMessages.length > 0) {
        // 아직 제출되지 않은 폼만 업데이트
        const formMsg = formMessages[0];
        const existingFormData = formMsg.form_data as Record<string, unknown> | null;
        if (!existingFormData?.is_submitted) {
          targetMessageId = formMsg.id;
        }
      }
    }

    // 폼 메시지의 form_data를 업데이트 (is_submitted: true 추가)
    if (targetMessageId) {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          form_data: { ...formData, is_submitted: true },
          updated_at: now,
        })
        .eq('id', targetMessageId);

      if (updateError) {
        console.error('Error updating message form data:', updateError);
      }
    }

    // Also save to chat_form_submissions table for tracking
    const { error } = await supabase
      .from('chat_form_submissions')
      .insert({
        conversation_id: conversationId,
        message_id: targetMessageId || null,
        user_id: userId,
        form_type: formType,
        form_data: formData,
        status: 'submitted',
        created_at: now,
        updated_at: now,
      });

    if (error) {
      console.error('Error submitting form:', error);
      return { success: false, error: error.message };
    }

    // Return the submission data
    const submissionData = {
      conversation_id: conversationId,
      message_id: targetMessageId,
      user_id: userId,
      form_type: formType,
      form_data: formData,
      status: 'submitted',
    };

    return { success: true, data: submissionData };
  } catch (error) {
    console.error('Error submitting form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit form'
    };
  }
}