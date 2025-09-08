-- Script di debug per verificare i dati salvati nelle tabelle travel
-- Esegui con: npx prisma db execute --file ./check-travel-data.sql --schema ./prisma/schema.prisma

-- 1. Controlla se ci sono dati in travel_cost_settings
SELECT '=== TRAVEL COST SETTINGS ===' as info;
SELECT 
    id,
    professional_id,
    base_cost,
    free_distance_km,
    is_active,
    created_at,
    updated_at
FROM travel_cost_settings
ORDER BY created_at DESC
LIMIT 10;

-- 2. Controlla gli scaglioni
SELECT '=== TRAVEL COST RANGES ===' as info;
SELECT 
    tcr.id,
    tcr.settings_id,
    tcr.from_km,
    tcr.to_km,
    tcr.cost_per_km,
    tcr.order_index,
    tcs.professional_id
FROM travel_cost_ranges tcr
LEFT JOIN travel_cost_settings tcs ON tcs.id = tcr.settings_id
ORDER BY tcr.settings_id, tcr.order_index
LIMIT 20;

-- 3. Controlla i supplementi
SELECT '=== TRAVEL SUPPLEMENTS ===' as info;
SELECT 
    ts.id,
    ts.settings_id,
    ts.supplement_type,
    ts.percentage,
    ts.fixed_amount,
    ts.is_active,
    tcs.professional_id
FROM travel_supplements ts
LEFT JOIN travel_cost_settings tcs ON tcs.id = ts.settings_id
ORDER BY ts.settings_id, ts.supplement_type
LIMIT 20;

-- 4. Controlla anche TravelCostRules per confronto
SELECT '=== TRAVEL COST RULES (vecchia tabella) ===' as info;
SELECT 
    id,
    name,
    "professionalId",
    "baseCallCost",
    "isActive",
    "isDefault"
FROM "TravelCostRules"
LIMIT 10;

-- 5. Conta i record
SELECT '=== CONTEGGIO RECORD ===' as info;
SELECT 
    'travel_cost_settings' as tabella,
    COUNT(*) as numero_record
FROM travel_cost_settings
UNION ALL
SELECT 
    'travel_cost_ranges' as tabella,
    COUNT(*) as numero_record
FROM travel_cost_ranges
UNION ALL
SELECT 
    'travel_supplements' as tabella,
    COUNT(*) as numero_record
FROM travel_supplements
UNION ALL
SELECT 
    'TravelCostRules' as tabella,
    COUNT(*) as numero_record
FROM "TravelCostRules";
