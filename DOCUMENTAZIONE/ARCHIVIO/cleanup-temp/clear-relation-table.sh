#!/bin/bash

echo "📊 STATO RELAZIONI - VERSIONE SEMPLICE"
echo "======================================"
echo ""
echo "Nel modello AssistanceRequest, quando fai una query:"
echo ""
echo "┌─────────────────────┬──────────────────┬─────────────────────────┐"
echo "│ COSA VUOI INCLUDERE │ COME LO SCRIVI   │ PERCHÉ                  │"
echo "├─────────────────────┼──────────────────┼─────────────────────────┤"
echo "│ Il cliente          │ client:          │ Ha @relation, minuscolo │"
echo "│ Il professionista   │ professional:    │ Ha @relation, minuscolo │"
echo "│ La sottocategoria   │ subcategory:     │ Ha @relation, minuscolo │"
echo "│ La categoria        │ Category:        │ NO @relation, MAIUSCOLO │"
echo "│ I preventivi        │ Quote:           │ NO @relation, MAIUSCOLO │"
echo "│ I messaggi          │ Message:         │ NO @relation, MAIUSCOLO │"
echo "│ Gli allegati        │ RequestAttachment:│ NO @relation, MAIUSCOLO │"
echo "└─────────────────────┴──────────────────┴─────────────────────────┘"
echo ""
echo "ESEMPIO PRATICO:"
echo "----------------"
cat << 'CODE'
// Quando fai una query su AssistanceRequest:
const richiesta = await prisma.assistanceRequest.findMany({
  include: {
    client: true,           // minuscolo ✅
    professional: true,     // minuscolo ✅
    subcategory: true,      // minuscolo ✅
    Category: true,         // MAIUSCOLO ❌ (da sistemare in futuro)
    Quote: true,            // MAIUSCOLO ❌ (da sistemare in futuro)
    Message: true,          // MAIUSCOLO ❌ (da sistemare in futuro)
    RequestAttachment: true // MAIUSCOLO ❌ (da sistemare in futuro)
  }
})
CODE
echo ""
echo "======================================"
echo ""
echo "STRATEGIA:"
echo "1. Usiamo questi nomi ORA per far funzionare tutto"
echo "2. Quando sistemiamo un file, SE tocchiamo una relazione"
echo "   senza @relation, la aggiungiamo per avere nomi minuscoli"
echo "3. Piano piano tutto diventerà minuscolo e pulito"
echo ""
echo "======================================"
