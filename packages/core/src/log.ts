export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  time: number;
  level: LogLevel;
  scope: string;
  message: string;
}

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  child(scope: string): Logger;
}

type Listener = (entry: LogEntry) => void;

/**
 * Ring-buffered log shared by every driver. The UI subscribes to it for the
 * diagnostics panel and users can download it when reporting a bug.
 */
export class LogBook {
  private entries: LogEntry[] = [];
  private listeners = new Set<Listener>();

  constructor(private readonly capacity = 1000) {}

  push(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.capacity) this.entries.shift();
    for (const listener of this.listeners) listener(entry);
  }

  all(): readonly LogEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries = [];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  logger(scope: string): Logger {
    const write = (level: LogLevel) => (message: string) =>
      this.push({ time: Date.now(), level, scope, message });
    return {
      debug: write('debug'),
      info: write('info'),
      warn: write('warn'),
      error: write('error'),
      child: (sub) => this.logger(`${scope}/${sub}`),
    };
  }

  toText(): string {
    return this.entries
      .map((e) => `${new Date(e.time).toISOString()} ${e.level.toUpperCase().padEnd(5)} [${e.scope}] ${e.message}`)
      .join('\n');
  }
}

export const hex = (bytes: ArrayLike<number>): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
