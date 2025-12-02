'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChatMessage, ChipType } from '../types';

export async function sendMessage(
  conversationId: string,
  content: string,
  type: 'user' | 'bot' | 'system' | 'form' | 'chips' = 'user',
  chipType?: ChipType,
  formData?: Record<string, any>
): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        type,
        content,
        chip_type: chipType,
        form_data: formData,
        is_read: type === 'user', // User messages are automatically read
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true, data };
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

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch messages' 
    };
  }
}

export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Update message read status
    const { error: messageError } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (messageError) {
      console.error('Error updating message read status:', messageError);
      return { success: false, error: messageError.message };
    }

    // Create or update read status record
    const { error: statusError } = await supabase
      .from('chat_message_status')
      .upsert({
        message_id: messageId,
        user_id: userId,
        is_read: true,
        read_at: new Date().toISOString(),
      }, {
        onConflict: 'message_id,user_id'
      });

    if (statusError) {
      console.error('Error updating read status:', statusError);
      return { success: false, error: statusError.message };
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
  formData: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Save form submission
    const { data, error } = await supabase
      .from('chat_form_submissions')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        user_id: userId,
        form_type: formType,
        form_data: formData,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting form:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true, data };
  } catch (error) {
    console.error('Error submitting form:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit form' 
    };
  }
}