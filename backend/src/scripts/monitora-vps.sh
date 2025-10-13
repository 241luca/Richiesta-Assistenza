#!/bin/bash

# MONITORA RISORSE VPS
# Ti avvisa PRIMA che sia troppo piccolo

echo "📊 MONITORAGGIO VPS"
echo "==================="

VPS_IP="95.217.123.456"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP << 'ENDSSH'

echo "🖥️ STATO SERVER:"
echo "----------------"

# CPU
echo -n "CPU: "
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
echo ""

# RAM
echo "RAM:"
free -h | grep Mem | awk '{print "Usata: "$3" di "$2" ("$3/$2")"}'
PERCENTUALE_RAM=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
echo "Percentuale usata: $PERCENTUALE_RAM%"
echo ""

# DISCO
echo "DISCO:"
df -h / | tail -1 | awk '{print "Usato: "$3" di "$2" ("$5")"}'
PERCENTUALE_DISCO=$(df / | tail -1 | awk '{print int($3/$2 * 100)}')
echo ""

# DATABASE
echo "DATABASE:"
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('richiesta_assistenza'));" | head -3 | tail -1
echo ""

# AVVISI
echo "⚠️  AVVISI:"
echo "---------"

if [ $PERCENTUALE_RAM -gt 80 ]; then
    echo "🔴 RAM QUASI PIENA! Considera upgrade!"
elif [ $PERCENTUALE_RAM -gt 60 ]; then
    echo "🟡 RAM al $PERCENTUALE_RAM% - Monitorare"
else
    echo "🟢 RAM OK"
fi

if [ $PERCENTUALE_DISCO -gt 80 ]; then
    echo "🔴 DISCO QUASI PIENO! Upgrade necessario!"
elif [ $PERCENTUALE_DISCO -gt 60 ]; then
    echo "🟡 Disco al $PERCENTUALE_DISCO% - Monitorare"
else
    echo "🟢 Disco OK"
fi

# SUGGERIMENTI
echo ""
echo "💡 QUANDO FARE UPGRADE:"
echo "----------------------"
echo "• RAM > 80% costantemente"
echo "• CPU > 70% spesso"
echo "• Disco > 80%"
echo "• App lenta"
echo ""
echo "📈 PROSSIMO PIANO CONSIGLIATO:"
if [ $PERCENTUALE_RAM -lt 40 ] && [ $PERCENTUALE_DISCO -lt 40 ]; then
    echo "Nessuno - hai tanto spazio!"
elif [ $PERCENTUALE_RAM -lt 60 ]; then
    echo "Resta così per ora"
else
    echo "Considera CX21 (4GB RAM) a €6/mese"
fi

ENDSSH

echo ""
echo "✅ Monitoraggio completato!"
