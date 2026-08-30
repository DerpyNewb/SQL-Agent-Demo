// ponytail: blocklist heuristic, not a full SQL parser — upgrade to a real
// SQL parser (e.g. node-sql-parser) if this ever fronts a DB with real data
// instead of a throwaway demo dataset.
const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|replace|vacuum|reindex)\b/i;

export function validateSelectOnly(sql) {
  const trimmed = sql.trim().replace(/;+\s*$/, '');

  if (trimmed.includes(';')) {
    return { ok: false, reason: 'Only a single statement is allowed.' };
  }
  if (!/^select\b/i.test(trimmed)) {
    return { ok: false, reason: 'Only SELECT statements are allowed.' };
  }
  if (FORBIDDEN.test(trimmed)) {
    return { ok: false, reason: 'Query contains a disallowed keyword.' };
  }
  return { ok: true, sql: trimmed };
}
