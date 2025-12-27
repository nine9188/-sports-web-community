'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
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

    revalidatePath('/');
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
    const chatMessages: ChatMessage[] = (data || []).map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      type: msg.type,
      content: msg.content || '',
      chip_type: msg.chip_type,
      form_data: msg.form_data as Record<string, unknown>,
      is_read: msg.is_read || false,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
    }));

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

    revalidatePath('/');
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

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete message' 
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

    // If messageId is provided, update the message's form_data
    if (messageId) {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          form_data: { ...formData, is_submitted: true },
          updated_at: now,
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('Error updating message form data:', updateError);
      }
    }

    // Also save to chat_form_submissions table for tracking
    const { error } = await supabase
      .from('chat_form_submissions')
      .insert({
        conversation_id: conversationId,
        message_id: messageId || null,
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
      message_id: messageId,
      user_id: userId,
      form_type: formType,
      form_data: formData,
      status: 'submitted',
    };

    revalidatePath('/');
    return { success: true, data: submissionData };
  } catch (error) {
    console.error('Error submitting form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit form'
    };
  }
}