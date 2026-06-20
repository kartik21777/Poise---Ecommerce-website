import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  transactionId?: string;
  orderId?: string;
  userId?: string;
  gateway?: string;
}

// Global thread-safe context mapping for correlation and tracing
export const correlationContext = new AsyncLocalStorage<LogContext>();

export class StructuredLogger {
  private category: string;

  constructor(category: string) {
    this.category = category;
  }

  private formatMessage(level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL', msg: string, args?: Record<string, any>): string {
    const context = correlationContext.getStore() || {};
    const timestamp = new Date().toISOString();

    const payload = {
      timestamp,
      level,
      category: this.category,
      message: msg,
      correlationId: args?.correlationId || context.correlationId,
      requestId: args?.requestId || context.requestId,
      transactionId: args?.transactionId || context.transactionId,
      orderId: args?.orderId || context.orderId,
      userId: args?.userId || context.userId,
      gateway: args?.gateway || context.gateway,
      ...args,
    };

    // Sanitize any potential PCI data or credential keys from the log payload
    this.sanitizePayload(payload);

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(payload);
    } else {
      const parts = [
        `[${timestamp}]`,
        `[${level}]`,
        `[${this.category}]`,
        msg,
      ];
      const traceMeta = [];
      if (payload.correlationId) traceMeta.push(`trace:${payload.correlationId}`);
      if (payload.transactionId) traceMeta.push(`tx:${payload.transactionId}`);
      if (traceMeta.length > 0) parts.push(`(${traceMeta.join(', ')})`);

      if (args && Object.keys(args).length > 0) {
        // Exclude handled fields from extra output inline to prevent pollution
        const cleanArgs = { ...args };
        delete cleanArgs.correlationId;
        delete cleanArgs.requestId;
        delete cleanArgs.transactionId;
        delete cleanArgs.orderId;
        delete cleanArgs.userId;
        delete cleanArgs.gateway;
        if (Object.keys(cleanArgs).length > 0) {
          parts.push(JSON.stringify(cleanArgs));
        }
      }
      return parts.join(' ');
    }
  }

  private sanitizePayload(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    // Explicit list of sensitive keys to redact from logs
    const sensitiveKeys = [
      'card', 'cvv', 'cvc', 'cardNumber', 'password', 'keyId', 'keySecret', 
      'clientSecret', 'token', 'authorization', 'signature', 'rawBody', 'webhookSecret'
    ];

    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        obj[key] = '[REDACTED_SECURITY]';
      } else if (typeof obj[key] === 'object') {
        this.sanitizePayload(obj[key]);
      }
    }
  }

  info(msg: string, args?: Record<string, any>): void {
    console.log(this.formatMessage('INFO', msg, args));
  }

  warn(msg: string, args?: Record<string, any>): void {
    console.warn(this.formatMessage('WARNING', msg, args));
  }

  error(msg: string, args?: Record<string, any>): void {
    console.error(this.formatMessage('ERROR', msg, args));
  }

  critical(msg: string, args?: Record<string, any>): void {
    console.error(this.formatMessage('CRITICAL', `🔥 CRITICAL FAULT: ${msg}`, args));
  }
}

export const logger = (category: string) => new StructuredLogger(category);
