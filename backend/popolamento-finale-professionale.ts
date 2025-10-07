import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function popolamentoCompletoProfessionale() {
  console.log('🔧 POPOLAMENTO COMPLETO DATABASE - VERSIONE PROFESSIONALE\n')
  console.log('=' * 60)

  try {
    // RECUPERA DATI ESISTENTI
    const users = await prisma.user.findMany()
    const clients = users.filter(u => u.role === 'CLIENT')
    const professionals = users.filter(u => u.role === 'PROFESSIONAL')
    const categories = await prisma.category.findMany()
    const subcategories = await prisma.subcategory.findMany()

    if (!clients.length || !professionals.length || !categories.length) {
      console.log('❌ ERRORE: Mancano dati base. Esegui prima il seed principale.')
      return
    }

    console.log(`📊 Trovati: ${clients.length} clienti, ${professionals.length} professionisti\n`)

    // ============= RICHIESTE COMPLETE E REALISTICHE =============
    console.log('📝 Creazione richieste COMPLETE con TUTTI i campi...\n')

    const richieste = [
      // IDRAULICA - URGENTE
      {
        title: 'Allagamento bagno - tubo rotto sotto lavandino',
        description: `URGENTE! Il tubo sotto il lavandino del bagno si è rotto stamattina.
L'acqua sta allagando tutto il bagno e sta iniziando a infiltrarsi nel pavimento.
Ho chiuso il rubinetto generale ma c'è ancora acqua residua che esce.
Il tubo sembra essersi spaccato nel punto di giunzione con lo scarico.
Appartamento al 3° piano, rischio danni all'appartamento sottostante.
Necessito intervento IMMEDIATO con materiali per riparazione.
Sono a casa tutto il giorno, disponibile subito.`,
        category: 'idraulica',
        subcategory: 'Riparazione perdite',
        priority: 'URGENT',
        address: 'Via del Corso 525',
        city: 'Roma',
        province: 'RM',
        postalCode: '00187',
        estimatedHours: 2,
        internalNotes: 'Cliente molto preoccupato per danni, priorità massima',
        publicNotes: 'Terzo piano, citofono Rossi, portare teli protettivi'
      },

      // ELETTRICITÀ - URGENTE  
      {
        title: 'Blackout totale appartamento - odore di bruciato dal quadro',
        description: `Da questa notte alle 3 è saltata tutta la corrente.
Il salvavita generale scatta immediatamente quando provo a riattivarlo.
C'è un forte odore di bruciato che proviene dal quadro elettrico.
Ho visto anche del fumo uscire da una delle ciabatte in salotto.
Appartamento 100mq, impianto del 1995 mai revisionato.
Sono senza corrente, il cibo nel freezer si sta scongelando.
Ho 2 bambini piccoli e mia madre anziana diabetica che necessita di conservare l'insulina in frigo.
MASSIMA URGENZA!`,
        category: 'elettricita',
        subcategory: 'Riparazione impianti',
        priority: 'URGENT',
        address: 'Corso Buenos Aires 43',
        city: 'Milano',
        province: 'MI',
        postalCode: '20124',
        estimatedHours: 4,
        internalNotes: 'Possibile rifacimento parziale impianto, preparare preventivo extra',
        publicNotes: 'Famiglia con urgenza medica, intervenire subito'
      },

      // CLIMATIZZAZIONE - ALTA PRIORITÀ
      {
        title: 'Caldaia Vaillant bloccata - codice errore F28 - no riscaldamento',
        description: `Caldaia Vaillant EcoTec Plus VMW 286/5-5 in blocco da ieri sera.
Display mostra errore F.28 (mancata accensione).
Ho già provato: reset (premuto tasto per 5 sec), controllo pressione acqua (1.4 bar),
verifica gas (fornelli funzionano), controllo corrente (c'è).
La fiamma pilota non si accende per niente.
Ultima manutenzione: 6 mesi fa, tutto ok.
Siamo senza acqua calda e riscaldamento, temperatura in casa 14°C.
Ho 2 bambini di 3 e 5 anni che stanno male.
Disponibile tutto il giorno, anche weekend.`,
        category: 'climatizzazione',
        subcategory: 'Riparazione caldaie',
        priority: 'HIGH',
        address: 'Via Toledo 156',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80134',
        estimatedHours: 3,
        internalNotes: 'Probabile problema scheda o valvola gas, portare ricambi comuni Vaillant',
        publicNotes: 'Secondo piano, famiglia con bambini, priorità'
      },

      // EDILIZIA - PROGETTO GRANDE
      {
        title: 'Ristrutturazione completa bagno 8mq con rifacimento impianti',
        description: `Ristrutturazione totale bagno principale (8mq).
DEMOLIZIONI: piastrelle, sanitari vecchi, vasca, impianti esistenti.
IMPIANTI NUOVI: 
- Idraulico: predisposizione doccia 120x80, attacchi sospesi, scarichi a parete
- Elettrico: nuovo quadretto, 4 punti luce, prese rasoio e lavatrice, estrattore
RIVESTIMENTI:
- Pavimento: gres porcellanato 60x60 grigio antiscivolo (già acquistato)
- Pareti: rivestimento h.120 zona doccia, h.200 resto, piastrelle 30x60 bianche
SANITARI E ARREDI:
- WC e bidet sospesi Ideal Standard Tesi
- Lavabo con mobile 80cm (da acquistare)
- Piatto doccia filo pavimento con scarico lineare
- Box doccia cristallo 8mm con porta scorrevole
FINITURE: stuccatura, pittura soffitto, sigillature
Budget approvato: 8.000€ max
Tempistica: inizio tra 2 settimane, max 15gg lavorativi`,
        category: 'edilizia',
        subcategory: 'Ristrutturazione bagni',
        priority: 'LOW',
        address: 'Via Garibaldi 18',
        city: 'Torino',
        province: 'TO',
        postalCode: '10122',
        estimatedHours: 120,
        internalNotes: 'Cliente esigente, fare sopralluogo dettagliato, contratto scritto',
        publicNotes: 'Condominio anni 60, verificare orari lavori rumorosi'
      },

      // FALEGNAMERIA - LAVORO CUSTOM
      {
        title: 'Armadio su misura camera matrimoniale - L.350 x H.275',
        description: `Necessito armadio su misura per nicchia camera matrimoniale.
MISURE ESATTE: Larghezza 350cm, Altezza 275cm (soffitto), Profondità 60cm
STRUTTURA: 
- 6 ante battenti (no scorrevoli per spazio)
- Struttura in nobilitato bianco spessore 18mm
- Ante in MDF laccato bianco opaco RAL 9010
INTERNO SUDDIVISIONE:
- Modulo 1-2: appenderia doppia con cassettiera 4 cassetti
- Modulo 3-4: appenderia singola alta + mensole regolabili
- Modulo 5-6: solo mensole regolabili (15 ripiani totali)
ACCESSORI:
- Cerniere soft close Blum
- Maniglie a gola integrate
- LED interni con sensore apertura
- Specchio interno anta centrale
TEMPISTICA: Entro 30 giorni
BUDGET: 3.500-4.000€`,
        category: 'falegnameria',
        subcategory: 'Armadi a muro',
        priority: 'MEDIUM',
        address: 'Via Zamboni 33',
        city: 'Bologna',
        province: 'BO',
        postalCode: '40126',
        estimatedHours: 40,
        internalNotes: 'Verificare accesso scale per trasporto pannelli, 4° piano',
        publicNotes: 'Prendere misure precise in fase sopralluogo, cliente pignolo'
      },

      // PULIZIE - SERVIZIO RICORRENTE
      {
        title: 'Pulizia post ristrutturazione appartamento 150mq',
        description: `Appartamento appena ristrutturato necessita pulizia professionale completa.
SUPERFICIE: 150mq + 2 balconi + cantina
STATO: Fine lavori edili, polvere di cantiere ovunque
SERVIZI RICHIESTI:
- Rimozione polvere da tutte le superfici (muri, soffitti, pavimenti)
- Pulizia vetri e infissi (12 finestre + 3 portefinestre)
- Lavaggio pavimenti con prodotti specifici per gres
- Pulizia e sanificazione 2 bagni completi
- Pulizia cucina nuova (ante, elettrodomestici, cappa)
- Rimozione etichette e residui colla da sanitari/vetri
- Aspirazione e pulizia termosifoni (12 elementi)
- Smaltimento materiali residui cantiere (già in sacchi)
PRODOTTI: Preferibilmente ecologici
TIMING: 2 giorni lavorativi disponibili
Data disponibile: prossimo weekend`,
        category: 'pulizie',
        subcategory: 'Pulizie post cantiere',
        priority: 'MEDIUM',
        address: 'Via Tornabuoni 1',
        city: 'Firenze',
        province: 'FI',
        postalCode: '50123',
        estimatedHours: 16,
        internalNotes: 'Portare aspiratore professionale e scala, verificare stato',
        publicNotes: 'Chiavi da ritirare in portineria, appartamento 5° piano'
      }
    ]

    // CREA LE RICHIESTE
    const richiesteCreate = []
    
    for (const req of richieste) {
      const client = clients[Math.floor(Math.random() * clients.length)]
      const category = categories.find(c => c.slug === req.category) || categories[0]
      const subcategory = subcategories.find(s => 
        s.name === req.subcategory && s.categoryId === category.id
      )
      
      // Assegna professionista per richieste urgenti
      const professional = req.priority === 'URGENT' || req.priority === 'HIGH'
        ? professionals[Math.floor(Math.random() * professionals.length)]
        : null
      
      const status = professional ? 'ASSIGNED' : 'PENDING'
      const requestedDate = new Date()
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + (req.priority === 'URGENT' ? 0 : 2))

      const newRequest = await prisma.assistanceRequest.create({
        data: {
          id: uuidv4(),
          title: req.title,
          description: req.description,
          priority: req.priority as any,
          status: status as any,
          clientId: client.id,
          categoryId: category.id,
          subcategoryId: subcategory?.id,
          professionalId: professional?.id,
          address: req.address,
          city: req.city,
          province: req.province,
          postalCode: req.postalCode,
          requestedDate: requestedDate,
          scheduledDate: scheduledDate,
          estimatedHours: req.estimatedHours,
          internalNotes: req.internalNotes,
          publicNotes: req.publicNotes,
          tags: ['nuovo', req.priority.toLowerCase()],
          updatedAt: new Date()
        }
      })
      
      richiesteCreate.push(newRequest)
      console.log(`✅ Richiesta: ${req.title.substring(0, 50)}...`)

      // ============= CREA PREVENTIVI DETTAGLIATI =============
      if (professional) {
        const baseAmount = req.estimatedHours * 3500 // 35€/ora base
        
        const quote = await prisma.quote.create({
          data: {
            id: uuidv4(),
            requestId: newRequest.id,
            professionalId: professional.id,
            title: `Preventivo per: ${req.title}`,
            description: `PREVENTIVO DETTAGLIATO

ANALISI DEL PROBLEMA:
${req.description.substring(0, 200)}...

SOLUZIONE PROPOSTA:
Intervento professionale completo con risoluzione definitiva del problema.
Utilizzo materiali certificati e conformi alle normative vigenti.

DETTAGLIO COSTI:
- Manodopera specializzata: ${req.estimatedHours}h x 35€/h
- Diritto di chiamata: €25
- Materiali: come da dettaglio items
- Trasporto: incluso

GARANZIE:
- 24 mesi su lavoro eseguito
- 12 mesi su materiali forniti
- Certificazione di conformità inclusa
- Fattura detraibile

TEMPISTICHE:
- Inizio lavori: entro ${req.priority === 'URGENT' ? '2 ore' : '48 ore'}
- Durata stimata: ${req.estimatedHours} ore
- Completamento: ${req.priority === 'URGENT' ? 'in giornata' : 'entro 3 giorni'}`,
            amount: Math.round(baseAmount * 1.3), // +30% per materiali e margine
            currency: 'EUR',
            status: req.priority === 'URGENT' ? 'ACCEPTED' : 'PENDING',
            validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            terms: 'Pagamento: 30% accettazione, saldo fine lavori. Accettazione via email fa fede.',
            notes: req.internalNotes,
            updatedAt: new Date()
          }
        })

        // CREA ITEMS DETTAGLIATI DEL PREVENTIVO
        await prisma.quoteItem.createMany({
          data: [
            {
              id: uuidv4(),
              quoteId: quote.id,
              description: `Manodopera specializzata - ${req.estimatedHours} ore`,
              quantity: req.estimatedHours,
              unitPrice: 3500,
              totalPrice: req.estimatedHours * 3500,
              order: 1
            },
            {
              id: uuidv4(),
              quoteId: quote.id,
              description: 'Diritto di chiamata' + (req.priority === 'URGENT' ? ' urgente' : ''),
              quantity: 1,
              unitPrice: req.priority === 'URGENT' ? 5000 : 2500,
              totalPrice: req.priority === 'URGENT' ? 5000 : 2500,
              order: 2
            },
            {
              id: uuidv4(),
              quoteId: quote.id,
              description: getMateriali(req.category),
              quantity: 1,
              unitPrice: Math.round(baseAmount * 0.25),
              totalPrice: Math.round(baseAmount * 0.25),
              order: 3
            },
            {
              id: uuidv4(),
              quoteId: quote.id,
              description: 'Trasporto e logistica',
              quantity: 1,
              unitPrice: 1500,
              totalPrice: 1500,
              order: 4
            }
          ]
        })

        console.log(`   💰 Preventivo: €${(quote.amount/100).toFixed(2)} - ${quote.status}`)
      }
    }

    // ============= REPORT FINALE =============
    console.log('\n' + '=' * 60)
    console.log('📊 REPORT POPOLAMENTO DATABASE')
    console.log('=' * 60)
    
    const totals = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count()
    }

    console.log(`
✅ Utenti totali: ${totals.users}
✅ Categorie: ${totals.categories}
✅ Sottocategorie: ${totals.subcategories}
✅ Richieste totali: ${totals.requests}
✅ Preventivi: ${totals.quotes}
✅ Voci preventivo: ${totals.quoteItems}

🎯 OGNI RICHIESTA HA:
- Titolo e descrizione REALISTICI e DETTAGLIATI
- Indirizzo, città, provincia, CAP REALI
- Priority corretta basata sull'urgenza
- Note interne per il professionista
- Note pubbliche per info aggiuntive
- Ore stimate per il lavoro
- Sottocategoria appropriata

💰 OGNI PREVENTIVO HA:
- Descrizione dettagliata della soluzione
- Items con prezzi realistici
- Termini e condizioni
- Garanzie offerte
- Tempistiche di intervento

✅ DATABASE POPOLATO PROFESSIONALMENTE!
`)

  } catch (error) {
    console.error('❌ ERRORE:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Funzione helper per materiali realistici
function getMateriali(categoria: string): string {
  const materiali: Record<string, string> = {
    'idraulica': 'Tubo multistrato, raccordi, guarnizioni, teflon, collanti',
    'elettricita': 'Cavi certificati, interruttori BTicino, morsetti, cassette derivazione',
    'climatizzazione': 'Gas refrigerante R32, tubi rame, isolante, staffaggi',
    'edilizia': 'Malta, cemento, mattoni, rete porta intonaco, primer',
    'falegnameria': 'Pannelli MDF, cerniere Blum, guide cassetti, colla vinilica, viti',
    'pulizie': 'Detergenti professionali, panni microfibra, sacchi smaltimento'
  }
  return materiali[categoria] || 'Materiali di consumo vari'
}

// Esegui
popolamentoCompletoProfessionale()
