'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChatMessage, ChipType } from '../types';
import type { Json } from '@/shared/lib/supabase/types';

export async function sendMessage(
  conversationId: string,
  content: string,
  type: 'user' | 'bot' | 'system' | 'form' | 'chips' = 'user',
  chipType?: ChipType,
  formData?: Record<string, unknown>
): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Map our application data to the actual database schema
    const contentJson: Json = {
      type,
      content,
      chip_type: chipType || null,
      form_data: formData ? JSON.parse(JSON.stringify(formData)) : null,
      is_read: type === 'user',
      conversation_id: conversationId,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: conversationId,
        role: type,
        content_json: contentJson,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    // Transform database data back to ChatMessage format
    const chatMessage: ChatMessage = {
      id: data.id,
      conversation_id: conversationId,
      type: type,
      content: content,
      chip_type: chipType,
      form_data: formData,
      is_read: type === 'user',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.created_at || new Date().toISOString(),
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
      .eq('session_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }

    // Transform database data to ChatMessage format
    const chatMessages: ChatMessage[] = (data || []).map((msg) => {
      const contentJson = msg.content_json as Record<string, unknown> || {};

      const transformedMsg = {
        id: msg.id,
        conversation_id: conversationId,
        type: (contentJson.type as ChatMessage['type']) || (msg.role as ChatMessage['type']) || 'bot',
        content: (contentJson.content as string) || '',
        chip_type: contentJson.chip_type as ChatMessage['chip_type'],
        form_data: contentJson.form_data as Record<string, unknown>,
        is_read: (contentJson.is_read as boolean) || false,
        created_at: msg.created_at || new Date().toISOString(),
        updated_at: msg.created_at || new Date().toISOString(),
      };

      return transformedMsg;
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

    // Get current message to update its content_json
    const { data: currentMsg, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('Error fetching message:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Update is_read flag in content_json
    const contentJson = (currentMsg.content_json as Record<string, unknown>) || {};
    const updatedContentJson: Json = JSON.parse(JSON.stringify({ ...contentJson, is_read: true }));

    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ content_json: updatedContentJson })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating message read status:', updateError);
      return { success: false, error: updateError.message };
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

    // Update the message to include form submission data in content_json
    const { data: currentMsg, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('Error fetching message:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Update content_json with form submission
    const contentJson = (currentMsg.content_json as Record<string, unknown>) || {};
    const updatedContentJson: Json = JSON.parse(JSON.stringify({
      ...contentJson,
      form_data: formData,
      is_submitted: true,
    }));

    const { error } = await supabase
      .from('chat_messages')
      .update({ content_json: updatedContentJson })
      .eq('id', messageId);

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