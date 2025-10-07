# 🔧 ISTRUZIONI MANUALI - Aggiungi AutoTravelInfo Props

## FILE: src/pages/RequestDetailPage.tsx

### PASSO 1: Trova la sezione AutoTravelInfo

Cerca nel file questa riga (dovrebbe essere intorno alla riga 680-720):

```tsx
<AutoTravelInfo
  requestId={id || ''}
  requestAddress={`${request.address}, ${request.city}, ${request.province} ${request.postalCode}`}
  onOpenMap={() => setShowMapModal(true)}
```

### PASSO 2: Aggiungi questi props DOPO requestAddress

Aggiungi queste righe esattamente dopo `requestAddress=...`:

```tsx
professionalAddress={
  request.professional?.workAddress 
    ? `${request.professional.workAddress}, ${request.professional.workCity}, ${request.professional.workProvince} ${request.professional.workPostalCode}`
    : undefined
}
travelDistance={request.travelDistance}
travelDuration={request.travelDuration}
travelDistanceText={request.travelDistanceText}
travelDurationText={request.travelDurationText}
travelCost={request.travelCost}
```

### RISULTATO FINALE

Dovrebbe apparire così:

```tsx
<AutoTravelInfo
  requestId={id || ''}
  requestAddress={`${request.address}, ${request.city}, ${request.province} ${request.postalCode}`}
  professionalAddress={
    request.professional?.workAddress 
      ? `${request.professional.workAddress}, ${request.professional.workCity}, ${request.professional.workProvince} ${request.professional.workPostalCode}`
      : undefined
  }
  travelDistance={request.travelDistance}
  travelDuration={request.travelDuration}
  travelDistanceText={request.travelDistanceText}
  travelDurationText={request.travelDurationText}
  travelCost={request.travelCost}
  onOpenMap={() => setShowMapModal(true)}
  onOpenItinerary={async () => {
    // ... resto del codice
  }}
/>
```

### VERIFICA

Dopo la modifica:
1. Salva il file (Cmd+S)
2. Il frontend dovrebbe ricaricarsi automaticamente
3. Apri una richiesta come professionista
4. Dovresti vedere "Informazioni di Viaggio"

---

## ⚠️ IMPORTANTE

Gli script hanno già aggiunto:
- ✅ Interface RequestDetail con campi travel
- ✅ professional.workAddress fields

Devi solo aggiungere i props al componente <AutoTravelInfo> come indicato sopra!

---

**Se hai problemi, dimmi dove sei bloccato!** 🔧
