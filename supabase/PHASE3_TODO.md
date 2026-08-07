# Phase 3 — businesses lockdown (not started)

Phase 3 is `lock_businesses_table.sql`: drops the "Public read businesses"
policy and the `pin` column, once phase 2 app code (already deployed) is
verified working against `businesses_public`. Do not run until then.

## Also fix while we're in here (unrelated, pre-existing bug)

`src/lib/payments.js` `isSubscriptionActive()` parses `plan_expires_at`
(a `timestamp without time zone` column, written as a UTC wall-clock value
via `expiresAt.toISOString()`) with plain `new Date(business.plan_expires_at)`.
Because the string has no offset, `new Date()` parses it as **browser-local**
time, not UTC. `daysUntilExpiry()` has the same issue.

This is latent and not part of this RLS migration — not fixing it on this
branch — but it means expiry checks are silently off by the visitor's UTC
offset (e.g. a plan that expired at midnight UTC reads as still active for
several more hours west of UTC). Worth a follow-up fix: parse as UTC
explicitly (e.g. append `'Z'` before constructing the `Date`, or switch the
column to `timestamptz`).
