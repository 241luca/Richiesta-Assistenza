-- Script per aggiungere il claim del sito alle impostazioni di sistema
INSERT INTO "SystemSettings" (
  "id",
  "key",
  "value",
  "type",
  "category",
  "description",
  "isActive",
  "isEditable",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'site_claim',
  'Il tuo problema, la nostra soluzione!',
  'text',
  'Branding',
  'Slogan o claim aziendale mostrato nella pagina di login',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("key") DO UPDATE 
SET 
  "value" = EXCLUDED."value",
  "category" = EXCLUDED."category",
  "description" = EXCLUDED."description",
  "updatedAt" = NOW();
