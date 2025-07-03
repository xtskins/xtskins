-- Atualiza todos os registros onde price_manually_set é null para false
UPDATE skins
SET price_manually_set = false
WHERE price_manually_set IS NULL; 