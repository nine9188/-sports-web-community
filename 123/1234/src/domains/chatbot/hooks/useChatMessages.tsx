'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatMessage } from '../types';
import { getMessages, sendMessage, markMessageAsRead } from '../actions/messageActions';

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  sendMessage: (content: string, type?: 'user' | 'bot' | 'system') => Promise<void>;
  markAsRead: (messageId: string, userId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChatMessages(conversationId: string | null): UseChatMessagesReturn {
  const queryClient = useQueryClient();

  // Fetch messages
  const { 
    data: messages = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const result = await getMessages(conversationId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      content, 
      type = 'user' 
    }: { 
      content: string; 
      type?: 'user' | 'bot' | 'system' 
    }) => {
      if (!conversationId) throw new Error('No active conversation');
      const result = await sendMessage(conversationId, content, type);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async ({ messageId, userId }: { messageId: string; userId: string }) => {
      const result = await markMessageAsRead(messageId, userId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messageReadStatus'] });
    },
  });

  const handleSendMessage = async (content: string, type: 'user' | 'bot' | 'system' = 'user') => {
    await sendMessageMutation.mutateAsync({ content, type });
  };

  const handleMarkAsRead = async (messageId: string, userId: string) => {
    await markAsReadMutation.mutateAsync({ messageId, userId });
  };

  return {
    messages,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
    isLoading: isLoading || sendMessageMutation.isPending || markAsReadMutation.isPending,
    error: error?.message || null,
  };
}