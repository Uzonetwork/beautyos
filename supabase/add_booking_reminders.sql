-- MUST be applied before this app code is deployed — PublicView now inserts
-- starts_at on every booking submission and will 400 until this column exists.
--
-- Booking reminders, phase 1 (manual wa.me / sms: links — no scheduled jobs).
--
-- Adds two columns to bookings:
--   starts_at         timestamptz, derived from the existing date/time/ampm
--                      text columns. Additive only — date/time/ampm are left
--                      untouched and nothing else reads starts_at yet.
--   reminder_sent_at   timestamptz, set optimistically client-side when an
--                      owner taps "Remind on WhatsApp" / "Remind by SMS".
--                      We can't confirm delivery, so this only means the
--                      owner tapped the button ("Reminded"), not "Delivered".
--
-- Idempotent: safe to run more than once.
--
-- RLS: both columns are covered by the existing row-level policies on
-- bookings ("Owner select/update/delete bookings", scoped via
-- business_id -> businesses.user_id = auth.uid()). Postgres RLS policies
-- apply per-row, not per-column, so no new policy is needed — one tenant
-- still can never see or update another tenant's bookings.

alter table bookings add column if not exists starts_at timestamptz;
alter table bookings add column if not exists reminder_sent_at timestamptz;

create index if not exists bookings_starts_at_idx on bookings (starts_at);

-- Backfill starts_at for existing rows from date ('YYYY-MM-DD'),
-- time ('H:MM' or 'HH:MM'), and ampm ('AM'/'PM'). The naive local
-- timestamp is interpreted as Africa/Lagos time (Nigeria has no DST,
-- fixed UTC+1) and converted to a proper timestamptz.
update bookings
set starts_at = (
  (
    (date::date)
    + (
        (
          (case
            when ampm = 'PM' and split_part(time, ':', 1)::int <> 12
              then split_part(time, ':', 1)::int + 12
            when ampm = 'AM' and split_part(time, ':', 1)::int = 12
              then 0
            else split_part(time, ':', 1)::int
          end)::text || ':' || split_part(time, ':', 2)
        )::time
      )
  ) at time zone 'Africa/Lagos'
)
where starts_at is null
  and date ~ '^\d{4}-\d{2}-\d{2}$'
  and time ~ '^\d{1,2}:\d{2}$'
  and ampm in ('AM', 'PM');
