-- Migrazione per aggiungere tabella cache indirizzi Google Maps
-- Data: 30 Agosto 2025

-- Tabella per cache degli indirizzi geocodificati
CREATE TABLE IF NOT EXISTS "AddressCache" (
    "id" SERIAL PRIMARY KEY,
    "addressHash" VARCHAR(32) UNIQUE NOT NULL,
    "originalAddress" TEXT NOT NULL,
    "formattedAddress" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "lastUsedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "hitCount" INTEGER DEFAULT 1
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS "idx_address_cache_hash" ON "AddressCache"("addressHash");
CREATE INDEX IF NOT EXISTS "idx_address_cache_expires" ON "AddressCache"("expiresAt");

-- Tabella per tariffe viaggio complesse
CREATE TABLE IF NOT EXISTS "TravelRates" (
    "id" SERIAL PRIMARY KEY,
    "professionalId" VARCHAR(50) REFERENCES "User"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "baseRate" INTEGER NOT NULL DEFAULT 0, -- Tariffa base chiamata in centesimi
    "perKmRate" INTEGER NOT NULL DEFAULT 50, -- Tariffa per km in centesimi
    -- Scaglioni chilometrici
    "kmRange1End" INTEGER DEFAULT 10, -- Fino a 10km
    "kmRange1Rate" INTEGER DEFAULT 50, -- €0.50/km
    "kmRange2End" INTEGER DEFAULT 30, -- Da 10 a 30km
    "kmRange2Rate" INTEGER DEFAULT 40, -- €0.40/km
    "kmRange3End" INTEGER DEFAULT 50, -- Da 30 a 50km
    "kmRange3Rate" INTEGER DEFAULT 35, -- €0.35/km
    "kmRangeOverRate" INTEGER DEFAULT 30, -- Oltre 50km: €0.30/km
    -- Supplementi
    "weekendSupplement" INTEGER DEFAULT 0, -- Supplemento weekend in %
    "nightSupplement" INTEGER DEFAULT 0, -- Supplemento notturno in %
    "urgencySupplement" INTEGER DEFAULT 0, -- Supplemento urgenza in %
    -- Zone tariffarie
    "zoneARates" JSONB, -- {"cityName": supplementInCents}
    "zoneBRates" JSONB, -- Zone con tariffe speciali
    -- Configurazione
    "isDefault" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "validFrom" TIMESTAMP,
    "validTo" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indice per ricerca veloce
CREATE INDEX IF NOT EXISTS "idx_travel_rates_professional" ON "TravelRates"("professionalId");
CREATE INDEX IF NOT EXISTS "idx_travel_rates_default" ON "TravelRates"("isDefault", "isActive");

-- Storico percorsi calcolati
CREATE TABLE IF NOT EXISTS "RouteHistory" (
    "id" SERIAL PRIMARY KEY,
    "requestId" VARCHAR(50) REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE,
    "professionalId" VARCHAR(50) REFERENCES "User"("id"),
    "originAddress" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL, -- in km
    "duration" INTEGER NOT NULL, -- in minuti
    "durationInTraffic" INTEGER, -- in minuti con traffico
    "polyline" TEXT, -- encoded polyline del percorso
    "travelCost" INTEGER, -- costo calcolato in centesimi
    "calculatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS "idx_route_history_request" ON "RouteHistory"("requestId");
CREATE INDEX IF NOT EXISTS "idx_route_history_professional" ON "RouteHistory"("professionalId");

-- Aggiungi colonne mancanti alla tabella User se non esistono
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workLatitude" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workLongitude" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Aggiungi colonne per coordinate alle richieste se non esistono
ALTER TABLE "AssistanceRequest" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "AssistanceRequest" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Commento per documentazione
COMMENT ON TABLE "AddressCache" IS 'Cache per geocoding indirizzi Google Maps';
COMMENT ON TABLE "TravelRates" IS 'Tariffe viaggio configurabili per professionista';
COMMENT ON TABLE "RouteHistory" IS 'Storico percorsi calcolati per analisi';
