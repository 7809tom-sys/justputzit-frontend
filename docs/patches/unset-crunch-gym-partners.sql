-- Hand-run only. Do not execute this from the migration runner, deploy, or CI.
-- The four seeded Crunch Fitness gyms are not Just Putzit partners.
-- Review the SELECT before the UPDATE, then run the UPDATE yourself.

SELECT id, name, city, is_partner, partner_tier
FROM gyms
WHERE id IN (30001, 30002, 30003, 30004)
   OR name IN (
     'Crunch Fitness - Waukesha',
     'Crunch Fitness - Brookfield',
     'Crunch Fitness - West Allis',
     'Crunch Fitness - Wauwatosa'
   );

UPDATE gyms
SET is_partner = 0
WHERE id IN (30001, 30002, 30003, 30004)
  AND name IN (
    'Crunch Fitness - Waukesha',
    'Crunch Fitness - Brookfield',
    'Crunch Fitness - West Allis',
    'Crunch Fitness - Wauwatosa'
  );
