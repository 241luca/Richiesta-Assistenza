-- Tabella per gestire interventi multipli programmati con conferma cliente
CREATE TABLE IF NOT EXISTS scheduled_interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES assistance_requests(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id),
    
    -- Date e tempi
    proposed_date TIMESTAMP NOT NULL,
    confirmed_date TIMESTAMP,
    completed_date TIMESTAMP,
    
    -- Stato intervento
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED' CHECK (status IN (
        'PROPOSED',    -- Proposto dal professionista
        'ACCEPTED',    -- Accettato dal cliente
        'REJECTED',    -- Rifiutato dal cliente
        'COMPLETED',   -- Intervento completato
        'CANCELLED'    -- Annullato
    )),
    
    -- Dettagli intervento
    intervention_number INTEGER NOT NULL DEFAULT 1, -- 1°, 2°, 3° intervento...
    description TEXT,
    estimated_duration INTEGER, -- minuti
    
    -- Conferme
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMP,
    rejected_reason TEXT,
    
    -- Collegamenti
    report_id UUID REFERENCES intervention_reports(id), -- quando completato
    
    -- Metadati
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indici per performance
    INDEX idx_request_interventions (request_id),
    INDEX idx_professional_interventions (professional_id),
    INDEX idx_status_interventions (status),
    INDEX idx_proposed_date (proposed_date),
    
    -- Constraint
    UNIQUE KEY unique_active_intervention (request_id, intervention_number)
);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_scheduled_interventions_updated_at
    BEFORE UPDATE ON scheduled_interventions
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;

-- Vista per interventi da confermare
CREATE VIEW pending_confirmations AS
SELECT 
    si.*,
    ar.title as request_title,
    ar.client_id,
    CONCAT(u_prof.first_name, ' ', u_prof.last_name) as professional_name,
    CONCAT(u_client.first_name, ' ', u_client.last_name) as client_name
FROM scheduled_interventions si
JOIN assistance_requests ar ON si.request_id = ar.id
JOIN users u_prof ON si.professional_id = u_prof.id
JOIN users u_client ON ar.client_id = u_client.id
WHERE si.status = 'PROPOSED'
ORDER BY si.proposed_date;

-- Aggiungiamo campo alla tabella richieste per tracciare se ci sono conferme pendenti
ALTER TABLE assistance_requests 
ADD COLUMN has_pending_interventions BOOLEAN DEFAULT FALSE,
ADD COLUMN next_intervention_date TIMESTAMP,
ADD COLUMN total_interventions_planned INTEGER DEFAULT 0;