'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatConversation } from '../types';
import { getConversations, createConversation, updateConversation } from '../actions/conversationActions';

interface UseChatConversationsReturn {
  conversations: ChatConversation[];
  createConversation: (title?: string) => Promise<ChatConversation>;
  updateConversation: (conversationId: string, updates: Partial<Pick<ChatConversation, 'title' | 'status'>>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChatConversations(userId: string): UseChatConversationsReturn {
  const queryClient = useQueryClient();

  // Fetch conversations
  const { 
    data: conversations = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['chatConversations', userId],
    queryFn: async () => {
      const result = await getConversations(userId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!userId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string = '새로운 대화') => {
      const result = await createConversation(userId, title);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
    },
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ 
      conversationId, 
      updates 
    }: { 
      conversationId: string; 
      updates: Partial<Pick<ChatConversation, 'title' | 'status'>> 
    }) => {
      const result = await updateConversation(conversationId, updates);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatConversations', userId] });
    },
  });

  const handleCreateConversation = async (title?: string): Promise<ChatConversation> => {
    return await createConversationMutation.mutateAsync(title);
  };

  const handleUpdateConversation = async (
    conversationId: string, 
    updates: Partial<Pick<ChatConversation, 'title' | 'status'>>
  ) => {
    await updateConversationMutation.mutateAsync({ conversationId, updates });
  };

  return {
    conversations,
    createConversation: handleCreateConversation,
    updateConversation: handleUpdateConversation,
    isLoading: isLoading || createConversationMutation.isPending || updateConversationMutation.isPending,
    error: error?.message || null,
  };
}