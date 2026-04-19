/**
 * 🔍 DEBUG LOGGER - Registra tutte le azioni del worker SmartDocs
 * Salva un log dettagliato che può essere scaricato e analizzato
 */

export interface DebugLogEntry {
  timestamp: string;
  step: number;
  action: string;
  status: 'START' | 'PROGRESS' | 'SUCCESS' | 'ERROR' | 'INFO';
  details: Record<string, any>;
  duration?: number;
}

export interface WorkerDebugLog {
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  container: {
    id: string;
    name: string;
  };
  document?: {
    title: string;
    entity_id: string;
  };
  steps: DebugLogEntry[];
  summary: {
    totalSteps: number;
    successCount: number;
    errorCount: number;
    chunksCreated: number;
    embeddingsCreated: number;
    tokensUsed: number;
  };
  errors: Array<{
    step: number;
    error: string;
    stack?: string;
  }>;
  database: {
    writes: Array<{
      table: string;
      operation: string;
      rowsAffected: number;
      timestamp: string;
    }>;
    totalWrites: number;
  };
}

class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private sessionId: string = `debug-${Date.now()}`;
  private startTime: Date = new Date();
  private containerInfo: { id: string; name: string } | null = null;
  private documentInfo: { title: string; entity_id: string } | null = null;
  private step: number = 0;
  private dbWrites: Array<any> = [];
  private errors: Array<any> = [];
  private summary = {
    totalSteps: 0,
    successCount: 0,
    errorCount: 0,
    chunksCreated: 0,
    embeddingsCreated: 0,
    tokensUsed: 0,
  };

  /**
   * Inizializza una nuova sessione di debug
   */
  init(containerId: string, containerName: string, documentTitle: string, entityId: string) {
    this.logs = [];
    this.sessionId = `debug-${Date.now()}`;
    this.startTime = new Date();
    this.step = 0;
    this.dbWrites = [];
    this.errors = [];
    this.containerInfo = { id: containerId, name: containerName };
    this.documentInfo = { title: documentTitle, entity_id: entityId };
    this.summary = {
      totalSteps: 0,
      successCount: 0,
      errorCount: 0,
      chunksCreated: 0,
      embeddingsCreated: 0,
      tokensUsed: 0,
    };

    this.addLog('INIZIO SESSIONE DEBUG', 'START', {
      sessionId: this.sessionId,
      container: this.containerInfo,
      document: this.documentInfo,
    });
  }

  /**
   * Aggiunge un log entry
   */
  addLog(
    action: string,
    status: 'START' | 'PROGRESS' | 'SUCCESS' | 'ERROR' | 'INFO' = 'INFO',
    details: Record<string, any> = {},
    duration?: number
  ) {
    this.step++;
    this.summary.totalSteps++;

    if (status === 'SUCCESS') this.summary.successCount++;
    if (status === 'ERROR') {
      this.summary.errorCount++;
      this.errors.push({ step: this.step, error: action, details });
    }

    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      step: this.step,
      action,
      status,
      details,
      duration,
    };

    this.logs.push(entry);

    const icon = this.getIcon(status);
    console.log(
      `${icon} [Step ${this.step}] ${action}`,
      details,
      duration ? `(${duration}ms)` : ''
    );
  }

  /**
   * Log per start di un'operazione
   */
  logStart(action: string, details?: Record<string, any>) {
    this.addLog(action, 'START', details);
  }

  /**
   * Log per progress
   */
  logProgress(action: string, details?: Record<string, any>) {
    this.addLog(action, 'PROGRESS', details);
  }

  /**
   * Log per successo
   */
  logSuccess(action: string, details?: Record<string, any>, duration?: number) {
    this.addLog(action, 'SUCCESS', details, duration);
  }

  /**
   * Log per errore
   */
  logError(action: string, error: Error | string, details?: Record<string, any>) {
    const errorMessage = error instanceof Error ? error.message : error;
    this.addLog(action, 'ERROR', {
      ...details,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  /**
   * Log per chunking
   */
  logChunk(chunkIndex: number, totalChunks: number, text: string, tokens: number) {
    this.summary.chunksCreated = totalChunks;
    this.addLog(`Chunk ${chunkIndex}/${totalChunks} creato`, 'PROGRESS', {
      chunkIndex,
      totalChunks,
      textLength: text.length,
      tokens,
      preview: text.substring(0, 100) + '...',
    });
  }

  /**
   * Log per embedding
   */
  logEmbedding(chunkId: string, vector: number[], similarity?: number) {
    this.summary.embeddingsCreated++;
    this.addLog(`Embedding generato per chunk`, 'PROGRESS', {
      chunkId: chunkId.substring(0, 20) + '...',
      vectorDimension: vector.length,
      vectorPreview: vector.slice(0, 5),
      similarity: similarity || 'N/A',
    });
  }

  /**
   * Log per operazione database
   */
  logDatabaseWrite(table: string, operation: string, rowsAffected: number) {
    this.dbWrites.push({
      table,
      operation,
      rowsAffected,
      timestamp: new Date().toISOString(),
    });

    this.addLog(`DB Write: ${table}`, 'PROGRESS', {
      table,
      operation,
      rowsAffected,
      totalWrites: this.dbWrites.length,
    });
  }

  /**
   * Log per tokens utilizzati
   */
  logTokens(tokens: number) {
    this.summary.tokensUsed += tokens;
    this.addLog(`Tokens utilizzati`, 'INFO', {
      tokens,
      totalTokens: this.summary.tokensUsed,
    });
  }

  /**
   * Restituisce il log completo
   */
  getFullLog(): WorkerDebugLog {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.startTime.getTime();

    return {
      sessionId: this.sessionId,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration,
      container: this.containerInfo!,
      document: this.documentInfo || undefined,
      steps: this.logs,
      summary: this.summary,
      errors: this.errors,
      database: {
        writes: this.dbWrites,
        totalWrites: this.dbWrites.length,
      },
    };
  }

  /**
   * Esporta il log in JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getFullLog(), null, 2);
  }

  /**
   * Esporta il log in CSV
   */
  exportCSV(): string {
    const lines: string[] = [];

    lines.push('Step,Timestamp,Action,Status,Duration(ms),Details,Container,Document');

    this.logs.forEach((log) => {
      const details = JSON.stringify(log.details).replace(/"/g, "'");
      lines.push(
        `${log.step},"${log.timestamp}","${log.action}","${log.status}",${log.duration || ''},"${details}","${this.containerInfo?.name || ''}","${this.documentInfo?.title || ''}"`
      );
    });

    return lines.join('\n');
  }

  /**
   * Scarica il log come file
   */
  downloadLog(format: 'json' | 'csv' = 'json') {
    const content = format === 'json' ? this.exportJSON() : this.exportCSV();
    const filename = `debug-log-${this.sessionId}.${format}`;

    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Ottieni i log come array
   */
  getLogs(): DebugLogEntry[] {
    return this.logs;
  }

  /**
   * Ottieni il riepilogo
   */
  getSummary() {
    return this.summary;
  }

  /**
   * Pulisci i log
   */
  clear() {
    this.logs = [];
    this.step = 0;
    this.dbWrites = [];
    this.errors = [];
    this.summary = {
      totalSteps: 0,
      successCount: 0,
      errorCount: 0,
      chunksCreated: 0,
      embeddingsCreated: 0,
      tokensUsed: 0,
    };
  }

  /**
   * Helper per ottenere l'icona dello status
   */
  private getIcon(status: string): string {
    const icons: Record<string, string> = {
      START: '▶️',
      PROGRESS: '⏳',
      SUCCESS: '✅',
      ERROR: '❌',
      INFO: 'ℹ️',
    };
    return icons[status] || '📝';
  }

  /**
   * Ottieni il session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Esporta l'istanza singleton
export const debugLogger = new DebugLogger();

export default DebugLogger;
