-- Cover the foreign keys and user-scoped OAuth transaction cleanup queries.
create index platform_oauth_tokens_account_owner_idx
  on public.platform_oauth_tokens (account_id, user_id);
create index platform_oauth_tokens_user_idx
  on public.platform_oauth_tokens (user_id);
create index youtube_oauth_transactions_user_expiry_idx
  on public.youtube_oauth_transactions (user_id, expires_at);
