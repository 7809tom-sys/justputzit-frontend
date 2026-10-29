-- Hand-run only. Do not execute this from the migration runner, deploy, or CI.
-- Venue records are stored in venue_partners. There is no table named venues.
-- This clears fictional 555 exchange numbers already stored on those rows.
-- Review the SELECT before the UPDATE, then run the UPDATE yourself.

SELECT id, name, city, phone
FROM venue_partners
WHERE phone REGEXP '555[-. ]?[0-9]{4}';

UPDATE venue_partners
SET phone = NULL
WHERE phone REGEXP '555[-. ]?[0-9]{4}';
