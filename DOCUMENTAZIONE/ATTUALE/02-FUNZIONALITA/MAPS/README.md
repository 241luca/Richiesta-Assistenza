# 📍 DOCUMENTAZIONE SISTEMA MAPS

**Ultimo Aggiornamento**: 03 Ottobre 2025  
**Versione**: 8.0.0

## 📋 STRUTTURA DOCUMENTAZIONE

### 📚 DOCUMENTO PRINCIPALE
- **[SISTEMA-MAPS-TRAVEL-INFO-COMPLETO-v8.md](./SISTEMA-MAPS-TRAVEL-INFO-COMPLETO-v8.md)** ⭐  
  Documentazione completa e aggiornata del sistema Maps e Travel Info

### 📊 DOCUMENTI DI SUPPORTO ATTUALI
- **[GOOGLE-MAPS-SOLUZIONE-MAPID.md](./GOOGLE-MAPS-SOLUZIONE-MAPID.md)**  
  Configurazione Map ID e stili personalizzati
  
- **[DOCS-UFFICIALE-VIS-GL-REACT-GOOGLE-MAPS.md](./DOCS-UFFICIALE-VIS-GL-REACT-GOOGLE-MAPS.md)**  
  Documentazione libreria @vis.gl/react-google-maps

- **[RICALCOLO-AUTOMATICO-COMPLETO-v7.md](./RICALCOLO-AUTOMATICO-COMPLETO-v7.md)**  
  Dettagli implementazione ricalcolo automatico distanze

### 📁 REPORT E CHANGELOG
- **[REPORT-FINALE-SISTEMA-MAPS-MODERNIZZATO.md](./REPORT-FINALE-SISTEMA-MAPS-MODERNIZZATO.md)**  
  Report modernizzazione sistema (30 Settembre 2025)

- **[REPORT-SISTEMAZIONE-MAPPE-20250930.md](./REPORT-SISTEMAZIONE-MAPPE-20250930.md)**  
  Report fix mappe

- **[SISTEMA-TRAVEL-INFO-COMPLETO-v6.md](./SISTEMA-TRAVEL-INFO-COMPLETO-v6.md)**  
  Versione precedente documentazione (02 Ottobre)

### 🗄️ DOCUMENTI OBSOLETI (OLD)
File marcati come OLD sono versioni superate:
- OLD-RIEPILOGO-TRAVEL-INFO.md
- OLD-SISTEMA-INFORMAZIONI-VIAGGIO.md
- OLD-SISTEMA-INFORMAZIONI-VIAGGIO-v1.1.0.md
- OLD-SISTEMA-INFORMAZIONI-VIAGGIO-QUICK.md
- OLD-TRAVEL-INFO-SYSTEM.md
- OLD-FIX-TRAVEL-INFO-03-OTTOBRE.md

---

## 🎯 QUICK REFERENCE

### Funzionalità Principali
✅ **Visualizzazione Mappe** - Google Maps interattivo  
✅ **Calcolo Distanze** - Con cache Redis  
✅ **Ricalcolo Automatico** - Su cambio work address  
✅ **Geocoding** - Conversione indirizzi ↔ coordinate  
✅ **Salvataggio DB** - Persistenza dati viaggio  

### File Chiave nel Codice
```
Backend:
├── /services/googleMaps.service.ts      # Servizio centralizzato
├── /services/travelCalculation.service.ts # Calcolo distanze
├── /routes/travel.routes.ts             # API endpoints
└── /routes/address.routes.ts            # Gestione indirizzi

Frontend:
├── /components/maps/RequestMap.tsx      # Mappa interattiva
├── /components/travel/AutoTravelInfo.tsx # Info viaggio
└── /components/address/WorkAddressForm.tsx # Form indirizzi
```

### Test Scripts
```bash
# Test ricalcolo automatico
npx ts-node test-work-address-change.ts

# Setup completo e test
npx ts-node setup-and-test-recalc.ts

# Check dati database
npx ts-node check-travel-data.ts
```

---

## 📞 SUPPORTO

Per domande o problemi consultare prima:
1. **[SISTEMA-MAPS-TRAVEL-INFO-COMPLETO-v8.md](./SISTEMA-MAPS-TRAVEL-INFO-COMPLETO-v8.md)**
2. Sezione Troubleshooting nella documentazione principale
3. Test scripts per verifiche

---

**Maintainer**: Luca Mambelli  
**Email**: lucamambelli@lmtecnologie.it