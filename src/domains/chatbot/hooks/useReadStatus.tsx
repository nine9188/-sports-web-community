'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/shared/api/supabase';

interface ReadStatusHookReturn {
  markAsRead: (messageId: string, conversationId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  getUnreadCount: (conversationId: string) => number;
  isMessageRead: (messageId: string) => boolean;
  isLoading: boolean;
}

export function useReadStatus(userId: string): ReadStatusHookReturn {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Get all message read statuses for the user
  const { data: readStatuses = [], isLoading } = useQuery({
    queryKey: ['messageReadStatus', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_message_status')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Mark single message as read
  const markAsReadMutation = useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      const { error: statusError } = await supabase
        .from('chat_message_status')
        .upsert({
          message_id: messageId,
          user_id: userId,
          conversation_id: conversationId,
          is_read: true,
          read_at: new Date().toISOString(),
        }, {
          onConflict: 'message_id,user_id'
        });

      if (statusError) throw statusError;

      // Also update the message itself
      const { error: messageError } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (messageError) throw messageError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageReadStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
  });

  // Mark entire conversation as read
  const markConversationAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // Get all unread messages in the conversation
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('is_read', false);

      if (messagesError) throw messagesError;

      if (messages && messages.length > 0) {
        // Create read status records for all unread messages
        const readStatusRecords = messages.map(message => ({
          message_id: message.id,
          user_id: userId,
          conversation_id: conversationId,
          is_read: true,
          read_at: new Date().toISOString(),
        }));

        const { error: statusError } = await supabase
          .from('chat_message_status')
          .upsert(readStatusRecords, {
            onConflict: 'message_id,user_id'
          });

        if (statusError) throw statusError;

        // Update all messages as read
        const { error: messagesUpdateError } = await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .eq('is_read', false);

        if (messagesUpdateError) throw messagesUpdateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageReadStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
    },
  });

  const markAsRead = useCallback(async (messageId: string, conversationId: string) => {
    await markAsReadMutation.mutateAsync({ messageId, conversationId });
  }, [markAsReadMutation]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    await markConversationAsReadMutation.mutateAsync(conversationId);
  }, [markConversationAsReadMutation]);

  const getUnreadCount = useCallback((conversationId: string): number => {
    return readStatuses.filter(status => 
      status.conversation_id === conversationId && !status.is_read
    ).length;
  }, [readStatuses]);

  const isMessageRead = useCallback((messageId: string): boolean => {
    const status = readStatuses.find(status => status.message_id === messageId);
    return status ? status.is_read : false;
  }, [readStatuses]);

  return {
    markAsRead,
    markConversationAsRead,
    getUnreadCount,
    isMessageRead,
    isLoading: isLoading || markAsReadMutation.isPending || markConversationAsReadMutation.isPending,
  };
}