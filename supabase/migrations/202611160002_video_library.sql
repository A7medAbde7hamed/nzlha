-- Private creator video library. Scheduling/publishing is intentionally not exposed yet.
create table if not exists public.video_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  platforms text[] not null check (
    cardinality(platforms) between 1 and 4
    and platforms <@ array['youtube', 'instagram', 'tiktok', 'facebook']::text[]
  ),
  status text not null default 'draft' check (status in ('draft', 'ready')),
  scheduled_at timestamptz,
  storage_path text,
  original_filename text,
  mime_type text check (mime_type is null or mime_type in ('video/mp4', 'video/quicktime', 'video/webm')),
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 52428800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_posts_file_metadata_consistent check (
    (storage_path is null and original_filename is null and mime_type is null and size_bytes is null)
    or (storage_path is not null and original_filename is not null and mime_type is not null and size_bytes is not null)
  ),
  constraint video_posts_storage_path_scoped check (
    storage_path is null or storage_path like user_id::text || '/%'
  )
);

create index if not exists video_posts_user_created_idx on public.video_posts (user_id, created_at desc);
alter table public.video_posts enable row level security;

create policy "Users can read their own videos"
  on public.video_posts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own videos"
  on public.video_posts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own videos"
  on public.video_posts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own videos"
  on public.video_posts for delete to authenticated
  using ((select auth.uid()) = user_id);
create trigger video_posts_set_updated_at before update on public.video_posts
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creator-videos', 'creator-videos', false, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = false, file_size_limit = 52428800,
  allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm'];

create policy "Users can upload their own videos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'creator-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can read their own video files"
  on storage.objects for select to authenticated
  using (bucket_id = 'creator-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can delete their own video files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'creator-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
