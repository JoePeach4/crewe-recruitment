-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- Adds fixture team/opposition team to each report (populated going forward
-- by import_jotform_reports.py and webhook-server.js).
alter table reports add column if not exists team text;
alter table reports add column if not exists opposition_team text;

-- Enables Realtime change notifications on reports so the dashboard's
-- live Report Feed can subscribe to new rows as they're inserted.
alter publication supabase_realtime add table reports;
