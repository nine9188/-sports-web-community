create table if not exists public.entity_news_summaries (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('team', 'player', 'match', 'league')),
  entity_id bigint not null,
  summary_blocks jsonb not null default '[]'::jsonb,
  source_post_ids jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type, entity_id)
);

create index if not exists entity_news_summaries_lookup_idx
  on public.entity_news_summaries(entity_type, entity_id, generated_at desc);
