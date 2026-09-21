export interface LogEntry {
  timestamp: string;
  action: string;
  status: "success" | "error" | "warning" | "info";
  message: string;
  details?: string;
}

// The browser-side service is intentionally limited to local connection-log
// presentation. GitHub requests belong to server/routes/integrations.ts so
// credentials, caching, scope checks, and rate limits stay server-side.
const connectionLogs: LogEntry[] = [];
let logListeners: (() => void)[] = [];

export function addConnectionLog(
  action: string,
  status: "success" | "error" | "warning" | "info",
  message: string,
  details?: string
) {
  const newEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    action,
    status,
    message,
    details
  };
  connectionLogs.unshift(newEntry);
  if (connectionLogs.length > 50) connectionLogs.pop();
  logListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error("Error in log listener:", error);
    }
  });
}

export function getConnectionLogs(): LogEntry[] {
  return [...connectionLogs];
}

export function subscribeToLogs(listener: () => void) {
  logListeners.push(listener);
  return () => {
    logListeners = logListeners.filter(current => current !== listener);
  };
}
