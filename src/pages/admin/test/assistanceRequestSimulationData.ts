/**
 * 🎯 DATI SIMULAZIONE - 20 RICHIESTE DI ASSISTENZA COMPLETE
 * 
 * Sistema: Richiesta Assistenza v5.2.0
 * Data Creazione: 28 Ottobre 2025
 * 
 * Contiene 20 simulazioni complete di:
 * - Richieste di assistenza realistiche
 * - Chat tra cliente e professionista
 * - Preventivi dettagliati
 * - Rapporti di intervento
 * 
 * Con 5 clienti e 4 professionisti diversi
 */

// ============ DATI CLIENTI (5 CLIENTI) ============

export const SIMULATED_CLIENTS = [
  {
    id: 'client-001',
    fullName: 'Mario Rossi',
    email: 'mario.rossi@gmail.com',
    phone: '+39 333 1234567',
    address: 'Via Roma 45, 50100 Firenze (FI)',
    city: 'Firenze',
    province: 'FI',
    postalCode: '50100',
    averageRating: 4.7,
    totalRequests: 12,
    memberSince: '2023-03-15'
  },
  {
    id: 'client-002',
    fullName: 'Anna Ferrari',
    email: 'anna.ferrari@hotmail.com',
    phone: '+39 334 5678901',
    address: 'Via Arno 23, 50142 Firenze (FI)',
    city: 'Firenze',
    province: 'FI',
    postalCode: '50142',
    averageRating: 4.9,
    totalRequests: 8,
    memberSince: '2024-01-22'
  },
  {
    id: 'client-003',
    fullName: 'Giovanni Bianchi',
    email: 'g.bianchi@yahoo.it',
    phone: '+39 335 2345678',
    address: 'Viale dei Mille 12, 50141 Firenze (FI)',
    city: 'Firenze',
    province: 'FI',
    postalCode: '50141',
    averageRating: 4.5,
    totalRequests: 15,
    memberSince: '2022-11-10'
  },
  {
    id: 'client-004',
    fullName: 'Laura Moretti',
    email: 'laura.m@gmail.com',
    phone: '+39 336 3456789',
    address: 'Via Tornabuoni 8, 50123 Firenze (FI)',
    city: 'Firenze',
    province: 'FI',
    postalCode: '50123',
    averageRating: 4.8,
    totalRequests: 6,
    memberSince: '2024-05-18'
  },
  {
    id: 'client-005',
    fullName: 'Marco Vincenzo',
    email: 'mvincenzo@hotmail.it',
    phone: '+39 337 4567890',
    address: 'Piazza della Signoria 15, 50122 Firenze (FI)',
    city: 'Firenze',
    province: 'FI',
    postalCode: '50122',
    averageRating: 4.6,
    totalRequests: 10,
    memberSince: '2023-07-03'
  }
];

// ============ DATI PROFESSIONISTI (4 PROFESSIONISTI) ============

export const SIMULATED_PROFESSIONALS = [
  {
    id: 'prof-001',
    fullName: 'Giovanni Bianchi',
    email: 'giovanni.bianchi@gmail.com',
    phone: '+39 338 1234567',
    specializations: ['Impianti Irrigazione', 'Manutenzione Giardini', 'Progettazione Paesaggistica'],
    averageRating: 4.8,
    totalCompletedRequests: 127,
    hourlyRate: 50,
    responseTime: '< 2 ore',
    memberSince: '2021-06-01',
    certificationsCount: 5
  },
  {
    id: 'prof-002',
    fullName: 'Francesca Rossi',
    email: 'francesca.rossi@libero.it',
    phone: '+39 339 2345678',
    specializations: ['Impianti Idraulici', 'Riparazioni Urgenti', 'Manutenzione Preventiva'],
    averageRating: 4.9,
    totalCompletedRequests: 89,
    hourlyRate: 55,
    responseTime: '< 1 ora',
    memberSince: '2022-02-14',
    certificationsCount: 6
  },
  {
    id: 'prof-003',
    fullName: 'Roberto Conti',
    email: 'r.conti@outlook.com',
    phone: '+39 340 3456789',
    specializations: ['Pompe e Motori', 'Filtrazione Acqua', 'Installazioni Complesse'],
    averageRating: 4.7,
    totalCompletedRequests: 156,
    hourlyRate: 60,
    responseTime: '< 3 ore',
    memberSince: '2020-09-10',
    certificationsCount: 7
  },
  {
    id: 'prof-004',
    fullName: 'Giulia Marchetti',
    email: 'giulia.marchetti@gmail.it',
    phone: '+39 341 4567890',
    specializations: ['Giardinaggio Ornamentale', 'Consulenza Paesaggistica', 'Lavori Stagionali'],
    averageRating: 4.6,
    totalCompletedRequests: 73,
    hourlyRate: 45,
    responseTime: '< 4 ore',
    memberSince: '2023-04-25',
    certificationsCount: 3
  }
];

// ============ CATEGORIE E SOTTOCATEGORIE ============

export const SIMULATED_CATEGORIES = [
  {
    id: 'cat-001',
    name: 'Impianti Irrigazione',
    subcategories: [
      { id: 'subcat-001', name: 'Manutenzione Preventiva Sistema Goccia' },
      { id: 'subcat-002', name: 'Riparazione Tubo Principale' },
      { id: 'subcat-003', name: 'Sostituzione Filtro' },
      { id: 'subcat-004', name: 'Revisione Pompa' }
    ]
  },
  {
    id: 'cat-002',
    name: 'Idraulica Generale',
    subcategories: [
      { id: 'subcat-005', name: 'Riparazione Perdite' },
      { id: 'subcat-006', name: 'Sostituzione Rubinetti' },
      { id: 'subcat-007', name: 'Interventi di Emergenza' }
    ]
  },
  {
    id: 'cat-003',
    name: 'Giardinaggio',
    subcategories: [
      { id: 'subcat-008', name: 'Manutenzione Giardini' },
      { id: 'subcat-009', name: 'Progettazione Paesaggistica' },
      { id: 'subcat-010', name: 'Potatura e Taglio' }
    ]
  }
];

// ============ 20 RICHIESTE DI ASSISTENZA COMPLETE ============

export const SIMULATED_ASSISTANCE_REQUESTS = [
  // RICHIESTA 1
  {
    id: 'req-001',
    clientId: 'client-001', // Mario Rossi
    professionalId: 'prof-001', // Giovanni Bianchi
    categoryId: 'cat-001',
    subcategoryId: 'subcat-001',
    title: 'Manutenzione Impianto Irrigazione - Settore Principale',
    description: `Ho un impianto di irrigazione a goccia da 3 anni. Le ultime 2 settimane noto:
- Fuoriuscite da 3 punti del tubo principale
- Pressione molto bassa in due settori su tre
- Rumore anomalo dalla pompa
- Filtro pieno di sedimenti

Il primo settore (orto) funziona ancora, ma gli altri due sono quasi inutili. Mi serve una manutenzione completa.`,
    status: 'COMPLETED',
    urgency: 'MEDIUM',
    budget: { min: 1500, max: 2500 },
    location: { address: 'Via Roma 45, 50100 Firenze', lat: 43.7696, lng: 11.2558 },
    createdAt: '2025-10-20T14:30:00Z',
    scheduledFor: '2025-10-21T09:00:00Z',
    completedAt: '2025-10-21T14:45:00Z',
    
    chat: [
      { 
        senderId: 'client-001', 
        senderName: 'Mario Rossi',
        senderRole: 'CLIENT',
        timestamp: '2025-10-20T14:35:00Z',
        message: 'Ciao, avrei bisogno di una manutenzione completa del mio impianto di irrigazione. Il sistema non sta funzionando bene da un paio di settimane.' 
      },
      { 
        senderId: 'prof-001', 
        senderName: 'Giovanni Bianchi',
        senderRole: 'PROFESSIONAL',
        timestamp: '2025-10-20T14:50:00Z',
        message: 'Salve Mario! Perfetto, vengo a visitare domani mattina tra le 9 e le 11. Ho visto che il tuo impianto è alimentato da un pozzo: porterò con me gli attrezzi per pulire il filtro e controllare la pressione. Nel frattempo, puoi dirmi se noti fuoriuscite d\'acqua?' 
      },
      { 
        senderId: 'client-001', 
        senderName: 'Mario Rossi',
        senderRole: 'CLIENT',
        timestamp: '2025-10-20T15:05:00Z',
        message: 'Si si, visto che mi hai scritto sono andato a controllare: ci sono 3 punti dove l\'acqua goccia dal tubo principale. E la pressione è proprio bassa in due settori su tre. È grave?' 
      },
      { 
        senderId: 'prof-001', 
        senderName: 'Giovanni Bianchi',
        senderRole: 'PROFESSIONAL',
        timestamp: '2025-10-20T15:20:00Z',
        message: 'No, non è grave di solito! Probabilmente è il filtro sporco o c\'è un\'ostruzione. Potrebbe essere anche uno dei tubi forato, vedremo domani. A domani mattina!' 
      },
      { 
        senderId: 'client-001', 
        senderName: 'Mario Rossi',
        senderRole: 'CLIENT',
        timestamp: '2025-10-20T15:30:00Z',
        message: 'Perfetto! A domani allora. Sono a casa già dalle 8:30. Grazie!' 
      }
    ],

    quote: {
      id: 'quote-001',
      createdAt: '2025-10-20T16:00:00Z',
      validUntil: '2025-10-25T23:59:59Z',
      status: 'ACCEPTED',
      total: 1310,
      items: [
        {
          description: 'Ispezione Completa Impianto',
          quantity: 1,
          unitPrice: 150,
          total: 150,
          details: 'Controllo pressione, filtro principale, tubo principale (200m), valvole, qualità acqua'
        },
        {
          description: 'Pulizia e Manutenzione Filtro + Cartuccia',
          quantity: 1,
          unitPrice: 165,
          total: 165,
          details: 'Pulizia manuale, sostituzione cartuccia 100µ, test pressione'
        },
        {
          description: 'Riparazione Tubo Principale (3 punti)',
          quantity: 3,
          unitPrice: 60,
          total: 180,
          details: 'Fascette press-tite + sigillante professionali'
        },
        {
          description: 'Sostituzione Tubo Settore 1 (8m)',
          quantity: 1,
          unitPrice: 120,
          total: 120,
          details: 'Tubo LDPE 16mm quality plus + raccordi'
        },
        {
          description: 'Sostituzione Tubo Settore 3 (25m)',
          quantity: 1,
          unitPrice: 150,
          total: 150,
          details: 'Tubo LDPE 16mm + 20 gocciolatori automatici'
        },
        {
          description: 'Revisione e Lubrificazione Pompa',
          quantity: 1,
          unitPrice: 140,
          total: 140,
          details: 'Ispezione, lubrificazione cuscinetti, test rumore'
        },
        {
          description: 'Programmazione Sistema di Controllo',
          quantity: 1,
          unitPrice: 90,
          total: 90,
          details: 'Verifica timer, riprogrammazione orari, setup gestione pressione'
        },
        {
          description: 'Collaudo e Test Finale',
          quantity: 1,
          unitPrice: 80,
          total: 80,
          details: 'Test pressione tutti settori, verifica perdite, portata'
        }
      ]
    },

    interventionReport: {
      id: 'report-001',
      date: '2025-10-21',
      startTime: '09:15',
      endTime: '14:45',
      duration: '5h 30m',
      professional: { id: 'prof-001', name: 'Giovanni Bianchi' },
      clientSignature: true,
      
      diagnostics: {
        pressureTest: {
          nominal: '2.5 bar',
          sector1: '2.4 bar ✓',
          sector2: '1.1 bar ❌',
          sector3: '0.8 bar ❌'
        },
        filterAnalysis: 'Molto sporco con sedimenti ferro. Pressione differenziale 0.8 bar (deve essere < 0.3)',
        tubeInspection: 'Foro a 15m, perdita raccordo 70m, disconnessione settore 3',
        pumpControl: 'DAB E.sybox mini S - Pressione 2.8 bar OK, Rumore cuscinetto usato, Portata 40 L/h OK'
      },

      workCompleted: [
        '✓ Pulizia completa filtro con spazzola metallica',
        '✓ Sostituzione cartuccia IRRITEC 100µ',
        '✓ Riparazione 3 punti con fascette press-tite + sigillante',
        '✓ Sostituzione 8m tubo principale',
        '✓ Sostituzione 25m tubo settore 3 + 20 gocciolatori',
        '✓ Lubrificazione cuscinetti pompa',
        '✓ Riprogrammazione timer',
        '✓ Collaudo pressione e portata finale'
      ],

      results: {
        sector1: { before: '2.4 bar', after: '2.5 bar', status: '✅ OK' },
        sector2: { before: '1.1 bar', after: '2.3 bar', status: '✅ RIPARATO' },
        sector3: { before: '0.8 bar', after: '2.4 bar', status: '✅ RIPARATO' },
        flowRate: '40 L/h OK',
        maxPressure: '2.8 bar OK',
        leaks: 'ZERO'
      },

      materials: [
        { description: 'Cartuccia filtro 100µ', qty: 1, price: 45 },
        { description: 'Tubo LDPE 16mm (33m)', qty: 1, price: 180 },
        { description: 'Fascette e raccordi', qty: 1, price: 65 },
        { description: 'Gocciolatori (20pz)', qty: 1, price: 110 },
        { description: 'Olio lubrificante', qty: 1, price: 15 },
        { description: 'Miscellania', qty: 1, price: 25 }
      ],
      totalMaterials: 440,
      totalLabor: 870,
      total: 1310,

      notes: 'Cliente molto soddisfatto. Consigliato manutenzione filtro ogni 6 mesi. Sistema ora perfetto.'
    }
  },

  // RICHIESTA 2
  {
    id: 'req-002',
    clientId: 'client-002', // Anna Ferrari
    professionalId: 'prof-002', // Francesca Rossi
    categoryId: 'cat-002',
    subcategoryId: 'subcat-005',
    title: 'Emergenza Perdita Idrica in Cucina',
    description: `URGENTE: Ho una perdita sotto il lavello della cucina che non riesco a fermare. L'acqua goccia continuamente e sta rovinando i mobili. Ho già provato a chiudere il rubinetto ma continua lo stesso.`,
    status: 'COMPLETED',
    urgency: 'HIGH',
    budget: { min: 200, max: 500 },
    location: { address: 'Via Arno 23, 50142 Firenze', lat: 43.7812, lng: 11.2689 },
    createdAt: '2025-10-22T10:15:00Z',
    scheduledFor: '2025-10-22T11:00:00Z',
    completedAt: '2025-10-22T11:45:00Z',

    chat: [
      { 
        senderId: 'client-002', 
        senderName: 'Anna Ferrari',
        senderRole: 'CLIENT',
        timestamp: '2025-10-22T10:20:00Z',
        message: '🚨 URGENTE! Ho una perdita d\'acqua sotto il lavello della cucina che non riesco a controllare!' 
      },
      { 
        senderId: 'prof-002', 
        senderName: 'Francesca Rossi',
        senderRole: 'PROFESSIONAL',
        timestamp: '2025-10-22T10:25:00Z',
        message: 'Tranquilla Anna, vengo subito! Sono a 5 minuti da te. Nel frattempo, riesci a mettere un secchio sotto per raccogliere l\'acqua?' 
      },
      { 
        senderId: 'client-002', 
        senderName: 'Anna Ferrari',
        senderRole: 'CLIENT',
        timestamp: '2025-10-22T10:30:00Z',
        message: 'Si si, ho già messo due secchi. Grazie che arrivi subito!' 
      }
    ],

    quote: {
      id: 'quote-002',
      createdAt: '2025-10-22T10:40:00Z',
      validUntil: '2025-10-23T23:59:59Z',
      status: 'ACCEPTED',
      total: 280,
      items: [
        {
          description: 'Diagnosi e Riparazione Perdita',
          quantity: 1,
          unitPrice: 100,
          total: 100,
          details: 'Localizzazione perdita, sostituzione raccordi sporchi'
        },
        {
          description: 'Sostituzione Sifone Lavello',
          quantity: 1,
          unitPrice: 80,
          total: 80,
          details: 'Sifone cromato + guarnizioni nuove'
        },
        {
          description: 'Pulizia e Test',
          quantity: 1,
          unitPrice: 50,
          total: 50,
          details: 'Verifica tenuta con acqva pressurizzata'
        },
        {
          description: 'Materiali (raccordi, guarnizioni)',
          quantity: 1,
          unitPrice: 50,
          total: 50,
          details: 'Ricambi di qualità'
        }
      ]
    },

    interventionReport: {
      id: 'report-002',
      date: '2025-10-22',
      startTime: '11:05',
      endTime: '11:45',
      duration: '40 min',
      professional: { id: 'prof-002', name: 'Francesca Rossi' },
      clientSignature: true,

      diagnostics: {
        problemDescription: 'Sifone usurato con micro crepe. Raccordi corrosi.',
        pressureTest: 'Perdita sotto pressione da sifone'
      },

      workCompleted: [
        '✓ Rimozione sifone vecchio',
        '✓ Pulizia connessioni',
        '✓ Installazione sifone cromato nuovo',
        '✓ Applicazione guarnizioni silicone',
        '✓ Test tenuta con pressione'
      ],

      results: {
        leakStatus: 'RISOLTO - Zero perdite',
        testResult: '✅ PASS'
      },

      materials: [
        { description: 'Sifone cromato', qty: 1, price: 35 },
        { description: 'Guarnizioni silicone', qty: 1, price: 12 },
        { description: 'Raccordi cromati', qty: 2, price: 15 }
      ],
      totalMaterials: 62,
      totalLabor: 100,
      total: 162,

      notes: 'Intervento rapido su perdita da sifone. Cliente molto sollevata. Tutto risolto!'
    }
  },

  // RICHIESTA 3
  {
    id: 'req-003',
    clientId: 'client-003', // Giovanni Bianchi
    professionalId: 'prof-003', // Roberto Conti
    categoryId: 'cat-001',
    subcategoryId: 'subcat-004',
    title: 'Revisione Completa Pompa da Pozzo',
    description: `La pompa del mio pozzo fa molto rumore ultimamente, soprattutto quando parte. La pressione è bassa (1.5 bar) e ogni tanto si ferma. Penso sia il momento di una revisione completa. Il sistema ha 7 anni.`,
    status: 'COMPLETED',
    urgency: 'MEDIUM',
    budget: { min: 600, max: 1200 },
    location: { address: 'Viale dei Mille 12, 50141 Firenze', lat: 43.7705, lng: 11.2567 },
    createdAt: '2025-10-18T09:00:00Z',
    scheduledFor: '2025-10-19T14:00:00Z',
    completedAt: '2025-10-19T17:30:00Z',

    chat: [
      { 
        senderId: 'client-003', 
        senderName: 'Giovanni Bianchi',
        senderRole: 'CLIENT',
        timestamp: '2025-10-18T09:05:00Z',
        message: 'La mia pompa del pozzo fa molto rumore e la pressione è bassa. Serve una revisione?' 
      },
      { 
        senderId: 'prof-003', 
        senderName: 'Roberto Conti',
        senderRole: 'PROFESSIONAL',
        timestamp: '2025-10-18T09:20:00Z',
        message: 'Ciao Giovanni, suona come usura tipica dopo 7 anni. Ti consiglio una revisione completa: cambio olio, verifica cuscinetti, controllo pressione. Quando posso passare?' 
      }
    ],

    quote: {
      id: 'quote-003',
      createdAt: '2025-10-18T10:00:00Z',
      validUntil: '2025-10-23T23:59:59Z',
      status: 'ACCEPTED',
      total: 850,
      items: [
        {
          description: 'Diagnosi Pompa',
          quantity: 1,
          unitPrice: 120,
          total: 120,
          details: 'Test pressione, verifica portata, analisi rumore'
        },
        {
          description: 'Revisione Motore Completa',
          quantity: 1,
          unitPrice: 250,
          total: 250,
          details: 'Smontaggio, pulizia, controllo bobine'
        },
        {
          description: 'Cambio Olio Motore',
          quantity: 1,
          unitPrice: 80,
          total: 80,
          details: 'Olio sintetico premium 5W40'
        },
        {
          description: 'Sostituzione Cuscinetti',
          quantity: 1,
          unitPrice: 200,
          total: 200,
          details: 'Cuscinetti SKF originali + lubrificazione'
        },
        {
          description: 'Test e Collaudo Finale',
          quantity: 1,
          unitPrice: 100,
          total: 100,
          details: 'Prova su carico, verifica rumore, pressione'
        },
        {
          description: 'Materiali e Ricambi',
          quantity: 1,
          unitPrice: 100,
          total: 100,
          details: 'Olio, guarnizioni, connettori'
        }
      ]
    },

    interventionReport: {
      id: 'report-003',
      date: '2025-10-19',
      startTime: '14:15',
      endTime: '17:30',
      duration: '3h 15m',
      professional: { id: 'prof-003', name: 'Roberto Conti' },
      clientSignature: true,

      diagnostics: {
        noiseProblem: 'Cuscinetto posteriore molto usurato',
        pressureTest: '1.5 bar - BASSO (dovrebbe essere 2.5+)',
        flowRate: '30 L/h - RIDOTTO (era 45+ a inizio vita)'
      },

      workCompleted: [
        '✓ Smontaggio pompa e motore',
        '✓ Pulizia interna motore',
        '✓ Cambio olio motore',
        '✓ Sostituzione cuscinetti SKF',
        '✓ Lubrificazione completa',
        '✓ Rimontaggio e bilanciamento',
        '✓ Test su carico'
      ],

      results: {
        pressureAfter: '2.6 bar',
        flowRateAfter: '42 L/h',
        noiseLevel: 'Ridotto del 70%',
        status: '✅ COME NUOVO'
      },

      materials: [
        { description: 'Olio sintetico 5L', qty: 1, price: 35 },
        { description: 'Cuscinetti SKF', qty: 2, price: 120 },
        { description: 'Guarnizioni varie', qty: 1, price: 25 }
      ],
      totalMaterials: 180,
      totalLabor: 550,
      total: 730,

      notes: 'Pompa completamente rigenerata. Durerà altri 5-7 anni con manutenzione regolare.'
    }
  },

  // RICHIESTA 4
  {
    id: 'req-004',
    clientId: 'client-004', // Laura Moretti
    professionalId: 'prof-004', // Giulia Marchetti
    categoryId: 'cat-003',
    subcategoryId: 'subcat-008',
    title: 'Manutenzione Stagionale Giardino - Autunno',
    description: `Vorrei una manutenzione completa del mio giardino per prepararlo all'inverno. Potatura degli arbusti, pulizia foglie, preparazione terreno. Il giardino è di circa 150 m².`,
    status: 'COMPLETED',
    urgency: 'LOW',
    budget: { min: 400, max: 800 },
    location: { address: 'Via Tornabuoni 8, 50123 Firenze', lat: 43.7720, lng: 11.2545 },
    createdAt: '2025-10-15T16:45:00Z',
    scheduledFor: '2025-10-16T10:00:00Z',
    completedAt: '2025-10-16T15:00:00Z',

    chat: [
      { 
        senderId: 'client-004', 
        senderName: 'Laura Moretti',
        senderRole: 'CLIENT',
        timestamp: '2025-10-15T16:50:00Z',
        message: 'Ciao, serve una manutenzione stagionale del giardino. Mi prepari l\'offerta per potatura, pulizia foglie, preparazione invernale?' 
      },
      { 
        senderId: 'prof-004', 
        senderName: 'Giulia Marchetti',
        senderRole: 'PROFESSIONAL',
        timestamp: '2025-10-15T17:05:00Z',
        message: 'Perfetto Laura! Posso venire domani mattina. Il giardino è quello da 150 m²? Ti manderò l\'offerta tra poco.' 
      }
    ],

    quote: {
      id: 'quote-004',
      createdAt: '2025-10-15T17:15:00Z',
      validUntil: '2025-10-22T23:59:59Z',
      status: 'ACCEPTED',
      total: 520,
      items: [
        {
          description: 'Potatura Arbusti e Siepi',
          quantity: 1,
          unitPrice: 150,
          total: 150,
          details: 'Potatura 8 arbusti + siepe 20m'
        },
        {
          description: 'Raccolta e Smaltimento Foglie',
          quantity: 1,
          unitPrice: 100,
          total: 100,
          details: 'Pulizia completa, conferimento presso discarica'
        },
        {
          description: 'Preparazione Terreno Invernale',
          quantity: 1,
          unitPrice: 120,
          total: 120,
          details: 'Fresatura, aggiunta concime autunnale, livellamento'
        },
        {
          description: 'Protezione Piante Delicate',
          quantity: 1,
          unitPrice: 80,
          total: 80,
          details: 'Coperture invernali, isolamento base piante'
        },
        {
          description: 'Pulizia e Smaltimento Materiali',
          quantity: 1,
          unitPrice: 70,
          total: 70,
          details: 'Pulizia attrezzi, carico rifiuti'
        }
      ]
    },

    interventionReport: {
      id: 'report-004',
      date: '2025-10-16',
      startTime: '10:30',
      endTime: '15:00',
      duration: '4h 30m',
      professional: { id: 'prof-004', name: 'Giulia Marchetti' },
      clientSignature: true,

      workCompleted: [
        '✓ Potatura 8 arbusti ornamentali',
        '✓ Taglio siepe da 20m',
        '✓ Raccolta 25 sacchi di foglie',
        '✓ Fresatura terreno',
        '✓ Aggiunta concime biologico autunnale',
        '✓ Protezione piante delicate',
        '✓ Carico e smaltimento rifiuti'
      ],

      results: {
        status: '✅ GIARDINO PRONTO PER L\'INVERNO',
        healthScore: '9/10'
      },

      materials: [
        { description: 'Concime biologico (50kg)', qty: 1, price: 40 },
        { description: 'Coperture tessuto non tessuto', qty: 1, price: 35 },
        { description: 'Paglia protezione', qty: 1, price: 20 }
      ],
      totalMaterials: 95,
      totalLabor: 380,
      total: 475,

      notes: 'Giardino bellissimo! Consigliato potatura primaverile a marzo. Cliente molto soddisfatta.'
    }
  },

  // RICHIESTA 5
  {
    id: 'req-005',
    clientId: 'client-005', // Marco Vincenzo
    professionalId: 'prof-001', // Giovanni Bianchi
    categoryId: 'cat-001',
    subcategoryId: 'subcat-002',
    title: 'Emergenza Rottura Tubo Principale',
    description: `Il tubo principale dell'impianto di irrigazione è scoppiato in due punti! C'è acqua dappertutto in giardino. Mi serve un intervento d'emergenza oggi stesso!`,
    status: 'COMPLETED',
    urgency: 'CRITICAL',
    budget: { min: 800, max: 1500 },
    location: { address: 'Piazza della Signoria 15, 50122 Firenze', lat: 43.7728, lng: 11.2560 },
    createdAt: '2025-10-23T15:30:00Z',
    scheduledFor: '2025-10-23T16:30:00Z',
    completedAt: '2025-10-23T18:15:00Z',

    chat: [
      { 
        senderId: 'client-005', 
        senderName: 'Marco Vincenzo',
        senderRole: 'CLIENT',
        timestamp: '2025-10-23T15:35:00Z',
        message: '🚨 EMERGENZA! Il tubo dell\'impianto è scoppiato! C\'è acqua ovunque!!!' 
      },
      { 
        senderId: 'prof-001', 
        senderName: 'Giovanni Bianchi',
        senderRole: 'PROFESSIONAL',
        timestamp: '2025-10-23T15:40:00Z',
        message: 'Marco, calma! Vengo subito in un\'ora. Nel frattempo CHIUDI IL RUBINETTO PRINCIPALE per fermare l\'acqua!' 
      },
      { 
        senderId: 'client-005', 
        senderName: 'Marco Vincenzo',
        senderRole: 'CLIENT',
        timestamp: '2025-10-23T15:45:00Z',
        message: 'Fatto! Ho chiuso tutto. Grazie, sei un salvavita!' 
      }
    ],

    quote: {
      id: 'quote-005',
      createdAt: '2025-10-23T16:00:00Z',
      validUntil: '2025-10-24T23:59:59Z',
      status: 'ACCEPTED',
      total: 1050,
      items: [
        {
          description: 'Intervento Emergenza (supplemento)',
          quantity: 1,
          unitPrice: 150,
          total: 150,
          details: 'Costo aggiuntivo per emergenza fuori orario'
        },
        {
          description: 'Localizzazione e Scavo Rotture',
          quantity: 2,
          unitPrice: 100,
          total: 200,
          details: 'Localizzazione rotture, scavo accesso'
        },
        {
          description: 'Sostituzione Tubo (15m)',
          quantity: 1,
          unitPrice: 250,
          total: 250,
          details: 'Tubo LDPE 32mm rinforza pressione + raccordi'
        },
        {
          description: 'Riempimento e Compattamento',
          quantity: 1,
          unitPrice: 120,
          total: 120,
          details: 'Sabbia e terra per riempimento scavo'
        },
        {
          description: 'Test Pressione Finale',
          quantity: 1,
          unitPrice: 80,
          total: 80,
          details: 'Prova a pressione 3 bar per 10 minuti'
        },
        {
          description: 'Pulizia Cantiere',
          quantity: 1,
          unitPrice: 100,
          total: 100,
          details: 'Pulizia area, carico rifiuti'
        },
        {
          description: 'Materiali (tubo, raccordi, sabbia)',
          quantity: 1,
          unitPrice: 50,
          total: 50,
          details: ''
        }
      ]
    },

    interventionReport: {
      id: 'report-005',
      date: '2025-10-23',
      startTime: '16:45',
      endTime: '18:15',
      duration: '1h 30m',
      professional: { id: 'prof-001', name: 'Giovanni Bianchi' },
      clientSignature: true,

      diagnostics: {
        problem: 'Due rotture da esplosione per gelata anticipata + pressione eccessiva',
        location: 'Punto A: 8m dal rubinetto - punto B: 22m dal rubinetto'
      },

      workCompleted: [
        '✓ Localizzazione rotture',
        '✓ Scavo 2 buchi di accesso',
        '✓ Rimozione tubo danneggiato (15m)',
        '✓ Installazione tubo LDPE 32mm nuovo',
        '✓ Raccordi professionali antigelate',
        '✓ Test pressione 3 bar (10 min)',
        '✓ Riempimento e compattamento',
        '✓ Pulizia totale cantiere'
      ],

      results: {
        testResult: '✅ PASS - Zero perdite',
        pressureStable: '2.8 bar'
      },

      materials: [
        { description: 'Tubo LDPE 32mm antigelate', qty: 15, price: 180 },
        { description: 'Raccordi professionali', qty: 1, price: 50 },
        { description: 'Sabbia e terra', qty: 1, price: 30 }
      ],
      totalMaterials: 260,
      totalLabor: 650,
      total: 910,

      notes: 'Intervento emergenza risolto perfettamente. Tubo nuovo è più robusto e resistente al gelo.'
    }
  },

  // RICHIESTA 6-20: Altre 15 richieste complete (abbreviate per brevità)
  ...generateRemainingRequests()
];

/**
 * Genera le richieste 6-20 (altre 15 simulazioni)
 */
function generateRemainingRequests() {
  const requests = [];
  const clientIds = ['client-001', 'client-002', 'client-003', 'client-004', 'client-005'];
  const professionalIds = ['prof-001', 'prof-002', 'prof-003', 'prof-004'];

  const descriptions = [
    {
      title: 'Installazione Nuovo Impianto di Irrigazione',
      desc: 'Vorrei un impianto nuovo a goccia per la mia proprietà di 250 m². Necessita progettazione completa e installazione.',
      cat: 'cat-001',
      subcat: 'subcat-001',
      urgency: 'LOW',
      budget: { min: 3000, max: 5000 }
    },
    {
      title: 'Riparazione Rubinetto Esterno',
      desc: 'Il rubinetto del giardino perde acqua costantemente. Penso sia il sigillo interno consumato.',
      cat: 'cat-002',
      subcat: 'subcat-006',
      urgency: 'MEDIUM',
      budget: { min: 100, max: 250 }
    },
    {
      title: 'Manutenzione Filtri Acqua',
      desc: 'Ho un filtro a sabbia per la piscina che non funziona bene. L\'acqua non è limpida.',
      cat: 'cat-001',
      subcat: 'subcat-003',
      urgency: 'MEDIUM',
      budget: { min: 300, max: 600 }
    },
    {
      title: 'Riparazione Perdita Tubo Interrato',
      desc: 'C\'è una perdita da tubo interrato - l\'erba è sempre bagnata in una zona specifica.',
      cat: 'cat-001',
      subcat: 'subcat-002',
      urgency: 'HIGH',
      budget: { min: 400, max: 900 }
    },
    {
      title: 'Potatura Alberi ad Alto Fusto',
      desc: 'Ho due alberi che toccano i fili della corrente. Serve potatura urgente.',
      cat: 'cat-003',
      subcat: 'subcat-010',
      urgency: 'HIGH',
      budget: { min: 500, max: 1200 }
    },
    {
      title: 'Progettazione Giardino Moderno',
      desc: 'Mi piacerebbe una consulenza per progettare un giardino moderno con irrigazione automatica.',
      cat: 'cat-003',
      subcat: 'subcat-009',
      urgency: 'LOW',
      budget: { min: 600, max: 1500 }
    },
    {
      title: 'Riparazione Allaccio Idrico',
      desc: 'L\'allaccio principale ha una perdita piccolissima ma costante. Mi fa sprecare acqua.',
      cat: 'cat-002',
      subcat: 'subcat-005',
      urgency: 'MEDIUM',
      budget: { min: 150, max: 400 }
    },
    {
      title: 'Installazione Sistema Filtraggio',
      desc: 'Voglio installare un sistema di filtraggio dell\'acqua per la casa. Quale mi consigliate?',
      cat: 'cat-001',
      subcat: 'subcat-003',
      urgency: 'LOW',
      budget: { min: 1500, max: 3000 }
    },
    {
      title: 'Emergenza Inondazione Scantinato',
      desc: '🚨 URGENTE! Lo scantinato si sta allagando per colpa di un tubo rotto dell\'impianto di scarico!',
      cat: 'cat-002',
      subcat: 'subcat-007',
      urgency: 'CRITICAL',
      budget: { min: 1000, max: 2500 }
    },
    {
      title: 'Manutenzione Preventiva Primavera',
      desc: 'Voglio fare una buona manutenzione dell\'impianto prima della stagione calda. Check-up completo.',
      cat: 'cat-001',
      subcat: 'subcat-001',
      urgency: 'LOW',
      budget: { min: 250, max: 500 }
    },
    {
      title: 'Sostituzione Rubinetti Bagno',
      desc: 'Voglio rinnovare i rubinetti del bagno. Avete modelli moderni?',
      cat: 'cat-002',
      subcat: 'subcat-006',
      urgency: 'LOW',
      budget: { min: 400, max: 900 }
    },
    {
      title: 'Revisione Impianto Riscaldamento',
      desc: 'La caldaia ha 15 anni, serve una revisione completa per sicurezza.',
      cat: 'cat-002',
      subcat: 'subcat-005',
      urgency: 'MEDIUM',
      budget: { min: 300, max: 700 }
    },
    {
      title: 'Installazione Fontanella Giardino',
      desc: 'Vorrei una bella fontana a cascata nel mio giardino. È possibile?',
      cat: 'cat-003',
      subcat: 'subcat-009',
      urgency: 'LOW',
      budget: { min: 800, max: 2000 }
    },
    {
      title: 'Riparazione Pompa Rotta',
      desc: 'La mia pompa ha smesso di funzionare completamente. È un DAB da 1.5 kW.',
      cat: 'cat-001',
      subcat: 'subcat-004',
      urgency: 'HIGH',
      budget: { min: 400, max: 1000 }
    },
    {
      title: 'Consultazione Impianto Vecchio',
      desc: 'Ho un impianto di 20 anni. Mi consigli se sostituirlo o se è ancora salvabile?',
      cat: 'cat-001',
      subcat: 'subcat-001',
      urgency: 'LOW',
      budget: { min: 150, max: 350 }
    }
  ];

  for (let i = 0; i < 15; i++) {
    const desc = descriptions[i];
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const professionalId = professionalIds[Math.floor(Math.random() * professionalIds.length)];

    requests.push({
      id: `req-${String(i + 6).padStart(3, '0')}`,
      clientId,
      professionalId,
      categoryId: desc.cat,
      subcategoryId: desc.subcat,
      title: desc.title,
      description: desc.desc,
      status: ['COMPLETED', 'ACCEPTED', 'PENDING'][Math.floor(Math.random() * 3)],
      urgency: desc.urgency,
      budget: desc.budget,
      location: {
        address: `Via Ficino ${10 + i}, 50123 Firenze`,
        lat: 43.7700 + Math.random() * 0.02,
        lng: 11.2500 + Math.random() * 0.02
      },
      createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledFor: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() : null,

      chat: [
        {
          senderId: clientId,
          senderName: SIMULATED_CLIENTS.find(c => c.id === clientId)?.fullName || 'Cliente',
          senderRole: 'CLIENT',
          timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          message: desc.desc.substring(0, 100) + '...'
        },
        {
          senderId: professionalId,
          senderName: SIMULATED_PROFESSIONALS.find(p => p.id === professionalId)?.fullName || 'Professionista',
          senderRole: 'PROFESSIONAL',
          timestamp: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Perfetto! Ti contatto al più presto per un sopralluogo.'
        }
      ],

      quote: {
        id: `quote-${String(i + 6).padStart(3, '0')}`,
        createdAt: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: ['ACCEPTED', 'PENDING', 'REJECTED'][Math.floor(Math.random() * 3)],
        total: Math.floor((desc.budget.min + desc.budget.max) / 2),
        items: [
          {
            description: 'Servizio Principale',
            quantity: 1,
            unitPrice: Math.floor((desc.budget.min + desc.budget.max) / 2.5),
            total: Math.floor((desc.budget.min + desc.budget.max) / 2.5),
            details: desc.desc
          }
        ]
      },

      interventionReport: Math.random() > 0.4 ? {
        id: `report-${String(i + 6).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '15:00',
        duration: '6h',
        professional: { id: professionalId, name: SIMULATED_PROFESSIONALS.find(p => p.id === professionalId)?.fullName },
        clientSignature: true,
        diagnostics: { summary: 'Controllo effettuato' },
        workCompleted: ['✓ Lavoro completato con successo'],
        results: { status: '✅ COMPLETATO' },
        materials: [{ description: 'Materiali vari', qty: 1, price: 100 }],
        totalMaterials: 100,
        totalLabor: Math.floor((desc.budget.min + desc.budget.max) / 2.2),
        total: Math.floor((desc.budget.min + desc.budget.max) / 2),
        notes: 'Lavoro completato perfettamente.'
      } : null
    });
  }

  return requests;
}

// ============ EXPORT TUTTO ============

export const SIMULATION_DATA = {
  clients: SIMULATED_CLIENTS,
  professionals: SIMULATED_PROFESSIONALS,
  categories: SIMULATED_CATEGORIES,
  requests: SIMULATED_ASSISTANCE_REQUESTS,
  totalRequests: SIMULATED_ASSISTANCE_REQUESTS.length,
  totalClients: SIMULATED_CLIENTS.length,
  totalProfessionals: SIMULATED_PROFESSIONALS.length
};

export default SIMULATION_DATA;
