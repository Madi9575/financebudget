type RateLimitState = Record<string, number[]>;

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const DANGEROUS_CHARS = /[<>`"']/g;
const MULTI_SPACE = /\s+/g;

export function sanitizeText(input: string, maxLength = 80) {
  return input
    .replace(CONTROL_CHARS, '')
    .replace(DANGEROUS_CHARS, '')
    .replace(MULTI_SPACE, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(input: string, maxLength = 120) {
  return sanitizeText(input, maxLength).toLowerCase();
}

export function sanitizeIconName(input: string, maxLength = 24) {
  return input.replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

export function normalizeColor(input: string, fallback = '#18181b') {
  return /^#[0-9a-fA-F]{6}$/.test(input) ? input : fallback;
}

export function clampNumber(value: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function parseCurrencyInput(input: string | number, min = 0, max = 1_000_000_000) {
  const normalized = typeof input === 'number'
    ? input
    : Number(String(input).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return clampNumber(Number.isFinite(normalized) ? normalized : min, min, max);
}

export function sanitizeDateInput(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

export function createId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createRateLimiter(limit = 8, windowMs = 10000) {
  const state: RateLimitState = {};

  return {
    allow(action: string) {
      const now = Date.now();
      const current = (state[action] || []).filter(timestamp => now - timestamp < windowMs);
      if (current.length >= limit) {
        state[action] = current;
        return false;
      }
      current.push(now);
      state[action] = current;
      return true;
    },
  };
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
