-- Template di notifiche per il sistema interventi multipli
INSERT INTO notification_templates (
    id, code, name, description, category,
    subject, html_content, text_content,
    variables, channels, priority,
    is_active, is_system, version
) VALUES 
-- Template: Interventi proposti (per cliente)
(
    gen_random_uuid(),
    'INTERVENTIONS_PROPOSED',
    'Interventi Proposti',
    'Notifica al cliente quando il professionista propone date',
    'interventions',
    'Nuovi interventi proposti per la tua richiesta',
    '<h2>Ciao {{userName}}!</h2>
    <p>Il professionista <strong>{{professionalName}}</strong> ha proposto <strong>{{interventionCount}}</strong> interventi per la tua richiesta:</p>
    <h3>📋 {{requestTitle}}</h3>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
    {{#each interventions}}
        <div style="margin-bottom: 10px;">
            <strong>Intervento #{{this.number}}</strong><br>
            📅 Data: {{this.date}}<br>
            🕐 Ora: {{this.time}}<br>
            📝 Descrizione: {{this.description}}<br>
            ⏱️ Durata prevista: {{this.duration}} minuti
        </div>
    {{/each}}
    </div>
    <p><a href="{{confirmUrl}}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">✅ CONFERMA LE DATE</a></p>
    <p>Se le date non vanno bene, puoi discutere alternative direttamente nella chat della richiesta.</p>',
    'Ciao {{userName}}, sono stati proposti {{interventionCount}} interventi. Conferma su: {{confirmUrl}}',
    '["userName", "professionalName", "interventionCount", "requestTitle", "interventions", "confirmUrl"]'::jsonb,
    '["database", "websocket", "email"]'::jsonb,
    'HIGH',
    true, true, 1
),

-- Template: Intervento accettato (per professionista)
(
    gen_random_uuid(),
    'INTERVENTION_ACCEPTED',
    'Intervento Accettato',
    'Notifica al professionista quando il cliente accetta una data',
    'interventions',
    'Il cliente ha accettato la data proposta',
    '<h2>Ottima notizia!</h2>
    <p>Il cliente <strong>{{clientName}}</strong> ha accettato la data proposta per:</p>
    <h3>📋 {{requestTitle}}</h3>
    <div style="background: #d1fae5; padding: 15px; border-radius: 8px;">
        <strong>✅ Intervento confermato</strong><br>
        📅 Data: {{interventionDate}}<br>
        🕐 Ora: {{interventionTime}}<br>
        📝 Descrizione: {{interventionDescription}}<br>
        📍 Indirizzo: {{requestAddress}}
    </div>
    <p><a href="{{viewUrl}}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">VEDI DETTAGLI</a></p>',
    '✅ {{clientName}} ha accettato l\'intervento del {{interventionDate}}. Dettagli: {{viewUrl}}',
    '["clientName", "requestTitle", "interventionDate", "interventionTime", "interventionDescription", "requestAddress", "viewUrl"]'::jsonb,
    '["database", "websocket", "email"]'::jsonb,
    'NORMAL',
    true, true, 1
),

-- Template: Intervento rifiutato (per professionista)
(
    gen_random_uuid(),
    'INTERVENTION_REJECTED', 
    'Intervento Rifiutato',
    'Notifica al professionista quando il cliente rifiuta una data',
    'interventions',
    'Il cliente ha rifiutato la data proposta',
    '<h2>Attenzione richiesta</h2>
    <p>Il cliente <strong>{{clientName}}</strong> ha rifiutato la data proposta per:</p>
    <h3>📋 {{requestTitle}}</h3>
    <div style="background: #fee2e2; padding: 15px; border-radius: 8px;">
        <strong>❌ Intervento rifiutato</strong><br>
        📅 Data proposta: {{interventionDate}}<br>
        💬 Motivo: {{rejectReason}}<br>
    </div>
    <p>Il cliente ha suggerito di discutere alternative via chat.</p>
    <p><a href="{{chatUrl}}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">💬 APRI CHAT</a></p>',
    '❌ {{clientName}} ha rifiutato l\'intervento del {{interventionDate}}. Motivo: {{rejectReason}}. Chat: {{chatUrl}}',
    '["clientName", "requestTitle", "interventionDate", "rejectReason", "chatUrl"]'::jsonb,
    '["database", "websocket", "email"]'::jsonb,
    'HIGH',
    true, true, 1
),

-- Template: Promemoria intervento (per cliente e professionista)
(
    gen_random_uuid(),
    'INTERVENTION_REMINDER',
    'Promemoria Intervento',
    'Promemoria automatico 24h prima dell\'intervento',
    'interventions',
    'Promemoria: Intervento programmato domani',
    '<h2>📅 Promemoria Intervento</h2>
    <p>Ti ricordiamo che domani è previsto un intervento:</p>
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
        <strong>{{requestTitle}}</strong><br>
        📅 Data: {{interventionDate}}<br>
        🕐 Ora: {{interventionTime}}<br>
        📝 Descrizione: {{interventionDescription}}<br>
        📍 Indirizzo: {{requestAddress}}<br>
        👷 Professionista: {{professionalName}}<br>
        📱 Contatto: {{professionalPhone}}
    </div>
    <p><a href="{{viewUrl}}" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">VEDI DETTAGLI</a></p>',
    'Promemoria: Domani {{interventionDate}} alle {{interventionTime}} - {{requestTitle}}',
    '["requestTitle", "interventionDate", "interventionTime", "interventionDescription", "requestAddress", "professionalName", "professionalPhone", "viewUrl"]'::jsonb,
    '["database", "websocket", "email", "sms"]'::jsonb,
    'NORMAL',
    true, true, 1
),

-- Template: Tutti gli interventi confermati
(
    gen_random_uuid(),
    'ALL_INTERVENTIONS_CONFIRMED',
    'Tutti Interventi Confermati',
    'Notifica quando tutti gli interventi sono stati confermati',
    'interventions',
    'Tutti gli interventi sono stati confermati',
    '<h2>✅ Piano interventi confermato!</h2>
    <p>Ottimo! Tutti gli interventi per la richiesta <strong>{{requestTitle}}</strong> sono stati confermati.</p>
    <h3>📅 Calendario interventi:</h3>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
    {{#each interventions}}
        <div style="margin-bottom: 10px; padding: 10px; background: white; border-left: 3px solid #10b981;">
            <strong>✅ Intervento #{{this.number}}</strong><br>
            📅 {{this.date}} alle {{this.time}}<br>
            📝 {{this.description}}
        </div>
    {{/each}}
    </div>
    <p><a href="{{calendarUrl}}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📅 AGGIUNGI AL CALENDARIO</a></p>',
    '✅ Tutti gli interventi confermati per {{requestTitle}}. Calendario: {{calendarUrl}}',
    '["requestTitle", "interventions", "calendarUrl"]'::jsonb,
    '["database", "websocket", "email"]'::jsonb,
    'NORMAL',
    true, true, 1
);

-- Aggiungi anche i tipi di notifica nella tabella notification_types se esiste
INSERT INTO notification_types (code, name, description, default_channels, is_active) VALUES
    ('INTERVENTIONS_PROPOSED', 'Interventi Proposti', 'Nuovi interventi proposti dal professionista', '["database", "websocket", "email"]'::jsonb, true),
    ('INTERVENTION_ACCEPTED', 'Intervento Accettato', 'Cliente ha accettato la data', '["database", "websocket", "email"]'::jsonb, true),
    ('INTERVENTION_REJECTED', 'Intervento Rifiutato', 'Cliente ha rifiutato la data', '["database", "websocket", "email"]'::jsonb, true),
    ('INTERVENTION_REMINDER', 'Promemoria Intervento', 'Promemoria 24h prima', '["database", "websocket", "email", "sms"]'::jsonb, true),
    ('ALL_INTERVENTIONS_CONFIRMED', 'Tutti Confermati', 'Tutti gli interventi confermati', '["database", "websocket", "email"]'::jsonb, true)
ON CONFLICT (code) DO NOTHING;