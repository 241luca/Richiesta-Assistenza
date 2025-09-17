#!/bin/bash

echo "🔍 ANALISI RELAZIONI SCHEMA"
echo "==========================="

cd backend

echo "Controllo modello User per relazioni notifiche:"
echo "------------------------------------------------"
grep -A 10 "^model User" prisma/schema.prisma | grep -E "(notification|Notification)"

echo ""
echo "Controllo modello NotificationChannel:"
echo "--------------------------------------"
grep -A 20 "^model NotificationChannel" prisma/schema.prisma

echo ""
echo "Controllo modello NotificationType:"
echo "-----------------------------------"
grep -A 20 "^model NotificationType" prisma/schema.prisma

echo ""
echo "Controllo modello UserNotificationPreference:"
echo "---------------------------------------------"
grep -A 15 "^model UserNotificationPreference" prisma/schema.prisma
