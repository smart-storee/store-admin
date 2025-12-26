/**
 * Utility functions for XSS protection
 */

// Function to sanitize HTML content
export const sanitizeHtml = (html: string): string => {
  if (typeof html !== 'string') {
    return '';
  }
  
  // Remove script tags and other potentially dangerous elements
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Function to escape HTML entities
export const escapeHtml = (unsafe: string): string => {
  if (typeof unsafe !== 'string') {
    return '';
  }
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Function to sanitize URLs
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') {
    return '#';
  }
  
  // Only allow safe URL schemes
  const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:'];
  const parsedUrl = new URL(url, window.location.origin);
  
  if (!allowedSchemes.includes(parsedUrl.protocol)) {
    return '#';
  }
  
  return parsedUrl.toString();
};

// Function to sanitize CSS properties
export const sanitizeCss = (css: string): string => {
  if (typeof css !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous CSS properties
  return css
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/url\s*\(\s*['"]?\s*javascript:/gi, '')
    .replace(/behavior\s*:/gi, '');
};