const EMOTICON_CODE_PATTERN = /~[a-z]+\d+/g;

export function extractEmoticonCodes(content: string): string[] {
  return content.match(EMOTICON_CODE_PATTERN) ?? [];
}

export async function incrementUserEmoticonUsage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  content: string
): Promise<void> {
  const codes = extractEmoticonCodes(content);
  if (codes.length === 0) return;

  const { error } = await supabase.rpc('increment_user_emoticon_usage', {
    p_codes: codes,
  });

  if (error) {
    console.error('[increment_user_emoticon_usage 실패]', error.message);
  }
}
