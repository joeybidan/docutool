-- Adds the CSAT MTD image slot to the existing dashboard_media table.
-- Safe to run after 20260914090000_dashboard_media.sql.

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
      'sop_quiz_of_day'
    )
  );

insert into public.dashboard_media (slot, is_published)
values ('csat_mtd', true)
on conflict (slot) do nothing;
