-- Add one admin-uploadable image slot for the CareLinx News panel.
-- Reuses existing Supabase dashboard_media table and dashboard-media Storage bucket.
-- No new bucket, permissions, or admin credentials are required.
-- Run ONLY in the live DocuTool project: blefujvmurpkgmiazbiq.

alter table public.dashboard_media
  drop constraint if exists dashboard_media_slot_check;

alter table public.dashboard_media
  add constraint dashboard_media_slot_check
  check (
    slot in (
      'qa_scores_rank_mtd',
      'csat_mtd',
      'puzzle_of_day',
      'caregiver_of_day',
      'sop_quiz_of_day',
      'carelinx_news'
    )
  );

insert into public.dashboard_media (slot, is_published)
values ('carelinx_news', true)
on conflict (slot) do nothing;
