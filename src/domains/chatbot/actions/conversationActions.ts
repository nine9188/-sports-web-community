'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { ChatConversation } from '../types';

export async function createConversation(
  userId: string,
  title: string = '새로운 대화'
): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        title,
        status: 'active',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true, data };
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
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
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
    const supabase = await createClient();

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

    revalidatePath('/');
    return { success: true, data };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update conversation' 
    };
  }
}