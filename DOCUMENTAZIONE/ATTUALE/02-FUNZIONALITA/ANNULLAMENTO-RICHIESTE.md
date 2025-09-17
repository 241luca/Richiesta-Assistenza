# 🚫 SISTEMA ANNULLAMENTO RICHIESTE - DOCUMENTAZIONE
**Data creazione**: 16 Gennaio 2025  
**Versione**: 1.0.0  
**Stato**: ✅ Implementato

---

## 📋 PANORAMICA

Sistema di annullamento richieste con motivazione obbligatoria per garantire tracciabilità e trasparenza.

---

## ⚙️ FUNZIONALITÀ

### 1. Modal di Annullamento
- **Trigger**: Pulsante X rosso nella dashboard admin
- **Validazione**: Motivo obbligatorio (min. 10 caratteri)
- **Conferma**: Doppia conferma per evitare annullamenti accidentali

### 2. Processo di Annullamento
1. Admin clicca pulsante annullamento
2. Si apre modal con form motivazione
3. Admin inserisce motivo dettagliato
4. Conferma annullamento
5. Sistema aggiorna stato a "CANCELLED"
6. Motivo salvato nelle note interne
7. Notifiche inviate agli interessati

### 3. Tracciabilità
- ✅ Motivo salvato in `internalNotes`
- ✅ Timestamp annullamento
- ✅ User che ha annullato (audit log)
- ✅ Notifiche automatiche

---

## 💻 IMPLEMENTAZIONE

### Frontend - Modal Component
```tsx
// Modal di annullamento in AdminDashboard.tsx
const [showCancelModal, setShowCancelModal] = useState(false);
const [selectedRequest, setSelectedRequest] = useState(null);
const [cancelReason, setCancelReason] = useState('');

const handleCancel = () => {
  if (cancelReason.length < 10) {
    toast.error('Inserire un motivo di almeno 10 caratteri');
    return;
  }
  
  cancelMutation.mutate({
    requestId: selectedRequest.id,
    reason: cancelReason
  });
};
```

### Backend - Endpoint
```typescript
// PUT /api/requests/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  const { reason } = req.body;
  
  // Validazione
  if (!reason || reason.length < 10) {
    return res.status(400).json({
      error: 'Motivo obbligatorio (min 10 caratteri)'
    });
  }
  
  // Aggiorna richiesta
  const updated = await prisma.assistanceRequest.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      internalNotes: `ANNULLATA: ${reason}\n${existing.internalNotes || ''}`
    }
  });
  
  // Invia notifiche
  await notificationService.notifyCancellation(updated);
});
```

---

## 🎨 UI/UX

### Modal Design
- **Titolo**: "Annulla Richiesta"
- **Campi**: Textarea per motivazione
- **Validazione**: Real-time character count
- **Buttons**: Annulla (grigio) / Conferma (rosso)
- **Warning**: Messaggio avviso azione irreversibile

### Visual Feedback
- ✅ Loading state durante annullamento
- ✅ Toast success/error
- ✅ Richiesta rimossa da lista (se filtri attivi)
- ✅ Badge "CANCELLED" rosso

---

## 📊 DATABASE

### Campi Utilizzati
- `status`: Impostato a 'CANCELLED'
- `internalNotes`: Contiene motivo annullamento con prefisso "ANNULLATA:"
- `updatedAt`: Timestamp annullamento

---

## 🔔 NOTIFICHE

### Destinatari
1. **Cliente**: "La tua richiesta è stata annullata"
2. **Professionista** (se assegnato): "Richiesta annullata"
3. **Admin**: Log in audit trail

### Template Notifica
```
Titolo: Richiesta Annullata
Messaggio: La richiesta #{id} è stata annullata.
Motivo: {reason}
```

---

## ✅ CHECKLIST FUNZIONALITÀ

- [x] Pulsante annullamento in dashboard
- [x] Modal con form motivazione
- [x] Validazione motivo obbligatorio
- [x] Salvataggio motivo in DB
- [x] Aggiornamento stato richiesta
- [x] Notifiche automatiche
- [x] Audit log operazione
- [x] Filtro "Nascondi annullate"

---

## 🔒 SICUREZZA

- Solo ADMIN e SUPER_ADMIN possono annullare
- Motivo obbligatorio per accountability
- Operazione tracciata in audit log
- Non cancellazione fisica (soft delete)

---

## 📈 STATISTICHE

Le richieste annullate:
- Rimangono nel database
- Sono escluse dai conteggi attivi
- Visibili nei report storici
- Analizzabili per pattern

---

**Documento creato da**: Sistema di Documentazione Automatica
