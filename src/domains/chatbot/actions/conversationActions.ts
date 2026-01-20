'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChatConversation } from '../types';
import { CHATBOT_MESSAGES } from '../constants/messages';

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

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 하루 이상 지난 active 대화들을 자동으로 종료
    const expiredConversations = (data || []).filter((conv) => {
      if (conv.status !== 'active') return false;
      const lastMessageAt = new Date(conv.last_message_at || conv.created_at);
      return lastMessageAt < oneDayAgo;
    });

    // 만료된 대화들 처리
    for (const conv of expiredConversations) {
      // 1. 시스템 메시지 추가
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conv.id,
          type: 'system',
          content: CHATBOT_MESSAGES.CONVERSATION_EXPIRED,
          is_read: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });

      // 2. 대화 상태를 completed로 변경
      await supabase
        .from('chat_conversations')
        .update({
          status: 'completed',
          updated_at: now.toISOString(),
        })
        .eq('id', conv.id);
    }

    // 만료된 대화가 있으면 데이터를 다시 조회
    let finalData = data;
    if (expiredConversations.length > 0) {
      const { data: refreshedData } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });
      finalData = refreshedData || data;
    }

    const conversations: ChatConversation[] = (finalData || []).map((conv) => ({
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