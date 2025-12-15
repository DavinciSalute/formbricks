#!/usr/bin/env node

/**
 * Script per monitorare le connessioni TCP CLOSE_WAIT e fare auto-reboot se necessario
 * Eseguito via cron ogni minuto
 */

import { execSync } from "child_process";
import { exit } from "process";

interface ConnectionStats {
  established: number;
  timeWait: number;
  closeWait: number;
  finWait: number;
  establishedPort3000: number;
  total: number;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  event: string;
  stats?: ConnectionStats;
  threshold?: number;
  action?: string;
  msg: string;
}

function log(entry: LogEntry): void {
  console.log(JSON.stringify(entry));
}

function getConnectionStats(): ConnectionStats {
  let netstatOutput: string;
  let usingSS = false;
  
  try {
    // Prova prima con 'ss' (più moderno e veloce)
    try {
      netstatOutput = execSync("ss -ant", { encoding: "utf-8", stdio: "pipe" });
      usingSS = true;
    } catch {
      // Fallback a netstat se ss non è disponibile
      netstatOutput = execSync("netstat -an", { encoding: "utf-8", stdio: "pipe" });
      usingSS = false;
    }
  } catch (error) {
    log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "connection_stats_error",
      msg: `Impossibile ottenere statistiche connessioni: ${error instanceof Error ? error.msg : String(error)}`,
    });
    throw error;
  }

  const lines = netstatOutput.split("\n").filter((line) => line.trim().startsWith("tcp"));
  
  let established = 0;
  let timeWait = 0;
  let closeWait = 0;
  let finWait = 0;
  let establishedPort3000 = 0;
  const total = lines.length;

  for (const line of lines) {
    const upperLine = line.toUpperCase();
    const parts = upperLine.split(/\s+/);
    
    // ss usa abbreviazioni: ESTAB, TIME-WAIT, CLOSE-WAIT, FIN-WAIT-1, FIN-WAIT-2
    // netstat usa nomi completi: ESTABLISHED, TIME_WAIT, CLOSE_WAIT, FIN_WAIT_1, FIN_WAIT_2
    
    if (usingSS) {
      // Formato ss: tcp ESTAB 0 0 127.0.0.1:3000 127.0.0.1:54321
      const state = parts[1] || "";
      if (state.includes("ESTAB")) {
        established++;
        if (line.includes(":3000") || line.includes("3000")) {
          establishedPort3000++;
        }
      } else if (state.includes("TIME-WAIT") || state.includes("TIME_WAIT")) {
        timeWait++;
      } else if (state.includes("CLOSE-WAIT") || state.includes("CLOSE_WAIT")) {
        closeWait++;
      } else if (state.includes("FIN-WAIT") || state.includes("FIN_WAIT")) {
        finWait++;
      }
    } else {
      // Formato netstat: tcp 0 0 127.0.0.1:3000 127.0.0.1:54321 ESTABLISHED
      if (upperLine.includes("ESTABLISHED")) {
        established++;
        if (line.includes(":3000") || line.includes("3000")) {
          establishedPort3000++;
        }
      } else if (upperLine.includes("TIME_WAIT")) {
        timeWait++;
      } else if (upperLine.includes("CLOSE_WAIT")) {
        closeWait++;
      } else if (upperLine.includes("FIN_WAIT")) {
        finWait++;
      }
    }
  }

  return {
    established,
    timeWait,
    closeWait,
    finWait,
    establishedPort3000,
    total,
  };
}

function shouldReboot(closeWait: number, threshold: number): boolean {
  return closeWait > threshold;
}

function performReboot(stats: ConnectionStats, threshold: number): void {
  log({
    timestamp: new Date().toISOString(),
    level: "warn",
    event: "reboot_triggered",
    stats,
    threshold,
    action: "process_exit",
    msg: `Reboot triggerato: ${stats.closeWait} connessioni CLOSE_WAIT superano la soglia di ${threshold}`,
  });

  // Termina il processo Node.js, Docker lo riavvierà automaticamente grazie a restart: always
  exit(1);
}

function main(): void {
  const disabled = process.env.CONNECTION_MONITOR_DISABLED === "1" || process.env.CONNECTION_MONITOR_DISABLED === "true";
  const threshold = parseInt(process.env.CONNECTION_CLOSE_WAIT_THRESHOLD || "250", 10);

  if (disabled) {
    log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "monitor_disabled",
      msg: "Monitoraggio connessioni disabilitato tramite CONNECTION_MONITOR_ENABLED",
    });
    exit(0);
  }

  try {
    const stats = getConnectionStats();

    log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "connection_stats",
      stats,
      threshold,
      msg: `Statistiche connessioni: ESTABLISHED=${stats.established} (porta 3000: ${stats.establishedPort3000}), TIME_WAIT=${stats.timeWait}, CLOSE_WAIT=${stats.closeWait}, FIN_WAIT=${stats.finWait}, Totale=${stats.total}`,
    });

    if (shouldReboot(stats.closeWait, threshold)) {
      performReboot(stats, threshold);
    } else {
      log({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "monitor_check_passed",
        stats,
        threshold,
        msg: `Monitoraggio OK: ${stats.closeWait} connessioni CLOSE_WAIT sotto la soglia di ${threshold}`,
      });
    }
  } catch (error) {
    log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "monitor_error",
      msg: `Errore durante il monitoraggio: ${error instanceof Error ? error.msg : String(error)}`,
    });
    exit(1);
  }
}

main();

