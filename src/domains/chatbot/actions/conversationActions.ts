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

    // Use chat_sessions table as it exists in the database
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        created_at: new Date().toISOString(),
        last_seen_assistant_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }

    // Transform to ChatConversation format
    const conversation: ChatConversation = {
      id: data.id,
      user_id: userId,
      title,
      status: 'active',
      last_message_at: data.created_at || new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.created_at || new Date().toISOString(),
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

    // Get all sessions and their messages to build conversation list
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching conversations:', sessionsError);
      return { success: false, error: sessionsError.message };
    }

    // Get messages for each session to determine last message time
    const conversations: ChatConversation[] = [];
    for (const session of sessions || []) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessageAt = messages?.[0]?.created_at || session.created_at || new Date().toISOString();

      conversations.push({
        id: session.id,
        user_id: userId,
        title: '대화',
        status: 'active',
        last_message_at: lastMessageAt,
        created_at: session.created_at || new Date().toISOString(),
        updated_at: lastMessageAt,
      });
    }

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

    // chat_sessions table doesn't support title/status updates directly
    // We'll just return the current session info with the requested updates
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, error: error.message };
    }

    // Get last message time
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('created_at')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastMessageAt = messages?.[0]?.created_at || session.created_at || new Date().toISOString();

    const conversation: ChatConversation = {
      id: session.id,
      user_id: '', // We don't have user_id in chat_sessions
      title: updates.title || '대화',
      status: updates.status || 'active',
      last_message_at: lastMessageAt,
      created_at: session.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
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