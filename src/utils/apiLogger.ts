// apiLogger.ts - Utility for logging API requests and responses
import { ApiResponse } from '@/types';

// Define log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  method: string;
  url: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  duration?: number;
  error?: string;
  userId?: number;
  sessionId?: string;
}

// Global logger configuration
interface LoggerConfig {
  enabled: boolean;
  logLevel: LogLevel;
  logToConsole: boolean;
  logToFile: boolean;
  maxLogSize: number; // in MB
}

let config: LoggerConfig = {
  enabled: true,
  logLevel: 'debug',
  logToConsole: true,
  logToFile: false, // We'll store logs in memory for this implementation
  maxLogSize: 10, // 10MB
};

// In-memory log storage
let logs: LogEntry[] = [];

// Log level severity
const logLevelSeverity: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Check if logging is enabled for a specific level
const isLogLevelEnabled = (level: LogLevel): boolean => {
  const currentLevelSeverity = logLevelSeverity[config.logLevel];
  const targetLevelSeverity = logLevelSeverity[level];
  return targetLevelSeverity >= currentLevelSeverity;
};

// Format log message
const formatLogMessage = (entry: LogEntry): string => {
  const timestamp = new Date(entry.timestamp).toISOString();
  const method = entry.method.padEnd(6);
  const status = entry.status ? entry.status.toString().padEnd(3) : '---';
  const duration = entry.duration ? `${entry.duration}ms` : '---';
  
  return `[${timestamp}] ${entry.level.toUpperCase()} | ${method} | ${status} | ${duration} | ${entry.url}`;
};

// Log to console
const logToConsole = (entry: LogEntry) => {
  if (!isLogLevelEnabled(entry.level)) return;
  
  const formattedMessage = formatLogMessage(entry);
  
  switch (entry.level) {
    case 'debug':
      console.debug(`%c${formattedMessage}`, 'color: #888');
      break;
    case 'info':
      console.info(`%c${formattedMessage}`, 'color: #00f');
      break;
    case 'warn':
      console.warn(`${formattedMessage}`, 'color: #ff0');
      break;
    case 'error':
      console.error(`${formattedMessage}`, 'color: #f00');
      break;
  }
  
  // Log additional details
  if (entry.requestBody) {
    console.log('Request Body:', entry.requestBody);
  }
  if (entry.responseBody) {
    console.log('Response Body:', entry.responseBody);
  }
  if (entry.error) {
    console.error('Error:', entry.error);
  }
};

// Add log entry
export const logApiCall = (entry: Omit<LogEntry, 'timestamp'>) => {
  if (!config.enabled) return;
  
  const logEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  // Add to logs array
  logs.push(logEntry);
  
  // Keep logs under max size by removing oldest entries
  if (logs.length > config.maxLogSize * 100) { // Rough estimate, 100 entries per MB
    logs = logs.slice(-config.maxLogSize * 100);
  }
  
  // Log to console if enabled
  if (config.logToConsole) {
    logToConsole(logEntry);
  }
};

// Get logs
export const getLogs = (): LogEntry[] => {
  return [...logs]; // Return a copy to prevent external modifications
};

// Get logs by level
export const getLogsByLevel = (level: LogLevel): LogEntry[] => {
  return logs.filter(log => log.level === level);
};

// Clear logs
export const clearLogs = () => {
  logs = [];
};

// Configure logger
export const configureLogger = (newConfig: Partial<LoggerConfig>) => {
  config = { ...config, ...newConfig };
};

// Get logger configuration
export const getLoggerConfig = (): LoggerConfig => {
  return { ...config };
};

// Log an API request
export const logApiRequest = (
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: any,
  userId?: number,
  sessionId?: string
) => {
  logApiCall({
    level: 'info',
    method,
    url,
    requestHeaders: headers,
    requestBody: body,
    userId,
    sessionId,
  });
};

// Log an API response
export const logApiResponse = (
  method: string,
  url: string,
  status: number,
  headers?: Record<string, string>,
  body?: any,
  duration: number = 0,
  userId?: number,
  sessionId?: string
) => {
  logApiCall({
    level: status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info',
    method,
    url,
    status,
    responseHeaders: headers,
    responseBody: body,
    duration,
    userId,
    sessionId,
  });
};

// Log an API error
export const logApiError = (
  method: string,
  url: string,
  error: string,
  userId?: number,
  sessionId?: string
) => {
  logApiCall({
    level: 'error',
    method,
    url,
    error,
    userId,
    sessionId,
  });
};