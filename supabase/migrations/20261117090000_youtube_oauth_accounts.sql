-- Stores user-owned platform metadata, one-time OAuth state, and encrypted provider tokens.
create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform = 'youtube'),
  provider_account_id text not null check (char_length(provider_account_id) between 1 and 256),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 200),
  avatar_url text check (avatar_url is null or avatar_url like 'https://%'),
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  unique (user_id, platform, provider_account_id),
  unique (id, user_id)
);

create index connected_accounts_user_platform_idx
  on public.connected_accounts (user_id, platform, connected_at desc);

alter table public.connected_accounts enable row level security;
revoke all on public.connected_accounts from anon, authenticated;
grant select, insert, update, delete on public.connected_accounts to authenticated;

create policy "Users can read their connected accounts"
  on public.connected_accounts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their connected accounts"
  on public.connected_accounts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their connected accounts"
  on public.connected_accounts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their connected accounts"
  on public.connected_accounts for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.platform_oauth_tokens (
  account_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  refresh_token_ciphertext text not null check (char_length(refresh_token_ciphertext) between 1 and 8192),
  updated_at timestamptz not null default now(),
  primary key (account_id),
  constraint platform_oauth_tokens_owner_fkey
    foreign key (account_id, user_id)
    references public.connected_accounts (id, user_id)
    on delete cascade
);

alter table public.platform_oauth_tokens enable row level security;
revoke all on public.platform_oauth_tokens from anon, authenticated;
grant select, insert, update, delete on public.platform_oauth_tokens to authenticated;

-- The database stores ciphertext only. The AES-256-GCM key exists only in server environment variables.
create policy "Users can read their encrypted platform tokens"
  on public.platform_oauth_tokens for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their encrypted platform tokens"
  on public.platform_oauth_tokens for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their encrypted platform tokens"
  on public.platform_oauth_tokens for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their encrypted platform tokens"
  on public.platform_oauth_tokens for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.youtube_oauth_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique check (state_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > created_at and expires_at <= created_at + interval '10 minutes')
);

create index youtube_oauth_transactions_expiry_idx
  on public.youtube_oauth_transactions (expires_at);

alter table public.youtube_oauth_transactions enable row level security;
revoke all on public.youtube_oauth_transactions from anon, authenticated;
grant select, insert, update, delete on public.youtube_oauth_transactions to authenticated;

create policy "Users can read their OAuth transactions"
  on public.youtube_oauth_transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their OAuth transactions"
  on public.youtube_oauth_transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their OAuth transactions"
  on public.youtube_oauth_transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their OAuth transactions"
  on public.youtube_oauth_transactions for delete to authenticated
  using ((select auth.uid()) = user_id);
