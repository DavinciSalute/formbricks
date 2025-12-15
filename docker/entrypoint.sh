#!/bin/sh
set -e

SUPERCRONIC_PID=""
NODE_PID=""

# Funzione per gestire la terminazione
cleanup() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Ricevuto segnale di terminazione, chiudo i processi..."
    if [ -n "$SUPERCRONIC_PID" ] && kill -0 "$SUPERCRONIC_PID" 2>/dev/null; then
        kill -TERM "$SUPERCRONIC_PID" 2>/dev/null || true
        wait "$SUPERCRONIC_PID" 2>/dev/null || true
    fi
    if [ -n "$NODE_PID" ] && kill -0 "$NODE_PID" 2>/dev/null; then
        kill -TERM "$NODE_PID" 2>/dev/null || true
        wait "$NODE_PID" 2>/dev/null || true
    fi
    exit 0
}

# Registra i gestori di segnali
trap cleanup TERM INT

# Avvia supercronic in background per i cronjob
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Avvio supercronic per i cronjob..."
supercronic /app/docker/cronjobs &
SUPERCRONIC_PID=$!

# Attendi un momento per assicurarsi che supercronic sia avviato
sleep 1

# Verifica che supercronic sia ancora in esecuzione
if ! kill -0 "$SUPERCRONIC_PID" 2>/dev/null; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERRORE: supercronic non è riuscito ad avviarsi"
    exit 1
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Supercronic avviato con PID: $SUPERCRONIC_PID"

# Avvia Next.js in foreground (senza exec, così possiamo gestire la terminazione)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Avvio Next.js..."
node apps/web/server.js &
NODE_PID=$!

# Attendi che Next.js termini (questo è il processo principale)
wait $NODE_PID
NODE_EXIT_CODE=$?

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Next.js terminato con codice: $NODE_EXIT_CODE"

# Termina anche supercronic quando Next.js termina
if [ -n "$SUPERCRONIC_PID" ] && kill -0 "$SUPERCRONIC_PID" 2>/dev/null; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Termino supercronic..."
    kill -TERM "$SUPERCRONIC_PID" 2>/dev/null || true
    wait "$SUPERCRONIC_PID" 2>/dev/null || true
fi

exit $NODE_EXIT_CODE

