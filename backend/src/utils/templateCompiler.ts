import Handlebars from 'handlebars';

/**
 * Extracts all {{placeholder}} variable names from a template string.
 */
export const extractPlaceholders = (text: string): string[] => {
  if (!text) return [];
  const regex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
};

/**
 * Compiles a Handlebars template string with a data context.
 */
export const compileTemplate = (templateStr: string, data: Record<string, any>): string => {
  if (!templateStr) return '';
  const template = Handlebars.compile(templateStr);
  return template(data || {});
};

/**
 * Validates that all required placeholders exist in the provided data object.
 * Returns an array of missing placeholder keys.
 */
export const validatePlaceholders = (requiredPlaceholders: string[], data: Record<string, any>): string[] => {
  if (!requiredPlaceholders || requiredPlaceholders.length === 0) return [];
  const payload = data || {};
  return requiredPlaceholders.filter(ph => {
    // Handle nested keys like "user.name"
    const keys = ph.split('.');
    let val: any = payload;
    for (const k of keys) {
      if (val === undefined || val === null) return true;
      val = val[k];
    }
    return val === undefined || val === null;
  });
};
