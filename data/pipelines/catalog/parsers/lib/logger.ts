/**
 * Minimal logger utilities for catalog scripts
 */

export interface Logger {
  info: (component: string, message: string) => void;
  warn: (component: string, message: string) => void;
  error: (component: string, message: string, context?: unknown, err?: Error) => void;
}

export function createComponentLogger(component: string): Logger {
  return {
    info: (_component, message) => console.log(`[${component}] ${message}`),
    warn: (_component, message) => console.warn(`[${component}] WARN: ${message}`),
    error: (_component, message, _context, err) => {
      if (err) {
        console.error(`[${component}] ERROR: ${message}\n`, err);
      } else {
        console.error(`[${component}] ERROR: ${message}`);
      }
    },
  };
}

// Generic logger with a default component label
export const logger: Logger = createComponentLogger("Catalogs");
