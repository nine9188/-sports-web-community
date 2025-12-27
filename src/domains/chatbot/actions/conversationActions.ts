'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChatConversation } from '../types';

export async function createConversation(
  userId: string,
  title: string = '새로운 대화'
): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const now = new Date().toISOString();

    // Use chat_conversations table (correct table name)
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        title,
        status: 'active',
        last_message_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }

    const conversation: ChatConversation = {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      status: data.status,
      last_message_at: data.last_message_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    revalidatePath('/');
    return { success: true, data: conversation };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create conversation'
    };
  }
}

export async function getConversations(
  userId: string
): Promise<{ success: boolean; data?: ChatConversation[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get conversations for the specific user from chat_conversations table
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, error: error.message };
    }

    const conversations: ChatConversation[] = (data || []).map((conv) => ({
      id: conv.id,
      user_id: conv.user_id,
      title: conv.title || '대화',
      status: conv.status || 'active',
      last_message_at: conv.last_message_at || conv.created_at,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    }));

    return { success: true, data: conversations };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch conversations'
    };
  }
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<Pick<ChatConversation, 'title' | 'status'>>
): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('chat_conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return { success: false, error: error.message };
    }

    const conversation: ChatConversation = {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      status: data.status,
      last_message_at: data.last_message_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    revalidatePath('/');
    return { success: true, data: conversation };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update conversation'
    };
  }
}