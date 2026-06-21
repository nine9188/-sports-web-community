import type { PostPollDraft } from '@/domains/boards/types/poll';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

type SupabasePollClient = {
  from: (table: string) => {
    insert: (row: unknown) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    } | Promise<{ error: { message: string } | null }>;
    upsert: (row: unknown) => Promise<{ error: { message: string } | null }>;
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
        order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
      };
    };
    update: (row: unknown) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
      in: (column: string, values: string[]) => Promise<{ error: { message: string } | null }>;
    };
  };
};

function createUuid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function normalizePostPollDraft(value: unknown): PostPollDraft | null {
  if (!value || typeof value !== 'object') return null;

  const draft = value as { question?: unknown; options?: unknown };
  const question = typeof draft.question === 'string' ? draft.question.trim() : '';
  const options = Array.isArray(draft.options)
    ? draft.options
        .map((option) => typeof option === 'string' ? option.trim() : '')
        .filter(Boolean)
        .slice(0, 5)
    : [];

  if (!question || options.length < 2) return null;

  return {
    question: question.slice(0, 120),
    options: options.map((option) => option.slice(0, 80)),
  };
}

export function extractPostPollDraftFromContent(content: unknown): PostPollDraft | null {
  if (!content || typeof content !== 'object') return null;

  let match: PostPollDraft | null = null;

  const visit = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return true;

    const record = node as { type?: unknown; attrs?: unknown; content?: unknown };
    if (record.type === 'pollBlock') {
      match = normalizePostPollDraft(record.attrs);
      return false;
    }

    if (Array.isArray(record.content)) {
      for (const child of record.content) {
        if (!visit(child)) return false;
      }
    }

    return true;
  };

  visit(content);
  return match;
}

async function insertPostPoll(params: {
  postId: string;
  userId: string;
  poll: PostPollDraft;
}) {
  const { postId, userId, poll } = params;
  const adminClient = getSupabaseAdmin() as unknown as SupabasePollClient;

  const pollInsert = adminClient.from('post_polls').insert({
    post_id: postId,
    question: poll.question,
    created_by: userId,
  }) as {
    select: (columns: string) => {
      single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
    };
  };

  const { data: pollRow, error: pollError } = await pollInsert.select('id').single();
  if (pollError || !pollRow) {
    throw new Error(pollError?.message || '투표 생성에 실패했습니다.');
  }

  await insertPostPollOptions(adminClient, pollRow.id, poll.options);
}

async function insertPostPollOptions(
  supabase: SupabasePollClient,
  pollId: string,
  options: string[],
) {
  const optionRows = options.map((optionText, index) => ({
    id: createUuid(),
    poll_id: pollId,
    option_text: optionText,
    display_order: index,
  }));

  const { error } = await supabase.from('post_poll_options').insert(optionRows) as { error: { message: string } | null };
  if (error) {
    throw new Error(error.message);
  }
}

function sameOptions(
  existingOptions: Array<Record<string, unknown>> | null,
  nextOptions: string[],
) {
  if (!existingOptions || existingOptions.length !== nextOptions.length) return false;

  return existingOptions.every((option, index) =>
    option.option_text === nextOptions[index] && option.display_order === index
  );
}

function buildOptionRowsByText(
  existingOptions: Array<Record<string, unknown>>,
  pollId: string,
  nextOptions: string[],
) {
  const unusedExistingOptions = [...existingOptions];

  return nextOptions.map((optionText, index) => {
    const matchIndex = unusedExistingOptions.findIndex((option) => option.option_text === optionText);
    if (matchIndex < 0) {
      return {
        id: createUuid(),
        poll_id: pollId,
        option_text: optionText,
        display_order: index,
      };
    }

    const [matchedOption] = unusedExistingOptions.splice(matchIndex, 1);
    return {
      id: matchedOption.id,
      poll_id: pollId,
      option_text: optionText,
      display_order: index,
    };
  });
}

export async function syncPostPoll(params: {
  supabase: unknown;
  postId: string;
  userId: string;
  poll: PostPollDraft | null;
}) {
  const { postId, userId, poll } = params;
  const adminClient = getSupabaseAdmin() as unknown as SupabasePollClient;

  const { data: existingPoll, error: existingError } = await adminClient
    .from('post_polls')
    .select('id, question')
    .eq('post_id', postId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!poll) {
    if (existingPoll?.id) {
      const { error } = await adminClient.from('post_polls').delete().eq('id', String(existingPoll.id));
      if (error) throw new Error(error.message);
    }
    return;
  }

  if (!existingPoll?.id) {
    await insertPostPoll({ postId, userId, poll });
    return;
  }

  if (existingPoll.question !== poll.question) {
    const { error } = await adminClient
      .from('post_polls')
      .update({ question: poll.question })
      .eq('id', String(existingPoll.id));
    if (error) throw new Error(error.message);
  }

  const { data: existingOptions, error: optionsError } = await adminClient
    .from('post_poll_options')
    .select('id, option_text, display_order')
    .eq('poll_id', String(existingPoll.id))
    .order('display_order', { ascending: true });

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  const options = existingOptions || [];
  if (sameOptions(options, poll.options)) return;

  const upsertRows = buildOptionRowsByText(options, String(existingPoll.id), poll.options);
  const nextOptionIds = new Set(upsertRows.map((row) => String(row.id)));
  const idsToDelete = options
    .filter((option) => !nextOptionIds.has(String(option.id)))
    .map((option) => String(option.id));

  for (let index = 0; index < options.length; index += 1) {
    const optionId = String(options[index].id);
    const { error: reorderError } = await adminClient
      .from('post_poll_options')
      .update({ display_order: index + 5 })
      .eq('id', optionId);
    if (reorderError) throw new Error(reorderError.message);
  }

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await adminClient
      .from('post_poll_options')
      .delete()
      .in('id', idsToDelete);
    if (deleteError) throw new Error(deleteError.message);
  }

  if (upsertRows.length > 0) {
    const { error: upsertError } = await adminClient
      .from('post_poll_options')
      .upsert(upsertRows);
    if (upsertError) throw new Error(upsertError.message);
  }
}
