-- Update plan quotas and prices according to new business rules
UPDATE "Plan"
SET
  "maxProducts" = 20,
  "priceMonthly" = 0,
  "features" = ARRAY['1 boutique', 'WhatsApp basic', '20 produits']
WHERE "name" = 'starter';

UPDATE "Plan"
SET
  "maxProducts" = 500,
  "priceMonthly" = 4500,
  "features" = ARRAY['3 boutiques', 'WhatsApp avancé', '500 produits', 'Import/Export', 'Analytics']
WHERE "name" = 'business';

UPDATE "Plan"
SET
  "maxProducts" = -1,
  "priceMonthly" = 10000,
  "features" = ARRAY['10 boutiques', 'WhatsApp illimité', 'Produits illimités', 'API', 'Support prioritaire']
WHERE "name" = 'premium';
