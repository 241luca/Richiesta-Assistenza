#!/bin/sh
# docker-entrypoint.sh
# Gira come root all'avvio per sistemare i permessi sui volumi montati,
# poi lancia l'app come utente nodejs tramite su-exec.
#
# Motivo: i volumi Docker vengono montati DOPO che il Dockerfile ha impostato
# i permessi, quindi appartengono a root e l'utente nodejs non può scriverci.

set -e

# Sistemiamo i permessi sulle directory montate come volumi
for dir in /app/uploads /app/logs /app/backups; do
  mkdir -p "$dir"
  chown -R nodejs:nodejs "$dir"
  chmod 755 "$dir"
done

echo "[entrypoint] Permessi cartelle OK, avvio come nodejs..."

# Passa l'esecuzione all'utente nodejs
exec su-exec nodejs "$@"
