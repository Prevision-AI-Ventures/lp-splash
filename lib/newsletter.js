// AI in the Courts newsletter signup: shared logic for the /api functions.
// Talks to the Resend REST API directly (Node 18+ global fetch), no SDK.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';

const API = 'https://api.resend.com';
const KEY = process.env.RESEND_API_KEY;
export const SEGMENT_ID = process.env.RESEND_SEGMENT_ID;                         // "AI in the Courts"
export const SUPPRESSION_SEGMENT_ID = process.env.RESEND_SUPPRESSION_SEGMENT_ID; // "Suppression - AI in the Courts"
export const SITE = process.env.SITE_URL || 'https://legalprecision.ai';
const UNSUB_SECRET = process.env.UNSUBSCRIBE_SECRET;

export const FROM = 'LegalPrecision AI <updates@legalprecision.ai>';
export const REPLY_TO = 'info@legalprecision.ai';

// Exact wording shown next to the checkbox. The server copy is the record of truth; bump the version if it changes.
export const CONSENT_TEXT = 'Email me AI in the Courts, the monthly LegalPrecision AI newsletter, and the filing review checklist. I can unsubscribe at any time.';
export const CONSENT_VERSION = 'aiic-v1-2026-11-20';

// Sign-ups from these domains are held: stored as unsubscribed in the suppression segment, no email sent,
// reviewed by hand. Protected rep accounts, clients and their firms, opposing parties, courts.
export const SUPPRESSED_DOMAINS = [
  'krwlawyers.com', 'zinda.law', 'zindalaw.com',   // Bali's protected accounts
  'lonestarlawfirm.com',                           // Lone Star Law Firm / Eggleston
  'dalessio.law',                                  // D'Alessio Law Group
  'morganlewis.com',                               // Morgan Lewis
  'txcourts.gov', 'uscourts.gov',                  // judges and court staff
];
export function suppressionReason(email) {
  const d = email.split('@')[1] || '';
  const hit = SUPPRESSED_DOMAINS.find((s) => d === s || d.endsWith('.' + s));
  if (hit) return `domain:${hit}`;
  if (/(^|\.)(courts?|judiciary|[a-z]*court[a-z]*)\.[a-z.]*gov$/.test(d) || /court/.test(d) && d.endsWith('.gov')) return `court:${d}`;
  return null;
}

const T = (f) => readFileSync(join(process.cwd(), 'email-templates', f), 'utf8');

async function api(method, path, body, extraHeaders = {}) {
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(`Resend ${method} ${path} ${r.status}: ${JSON.stringify(data)}`); e.status = r.status; throw e; }
  return data;
}

export const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 24);

export function unsubscribeUrl(email) {
  const sig = crypto.createHmac('sha256', UNSUB_SECRET).update(email.toLowerCase()).digest('hex').slice(0, 32);
  return `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&s=${sig}`;
}
export function verifyUnsub(email, sig) {
  const want = crypto.createHmac('sha256', UNSUB_SECRET).update(email.toLowerCase()).digest('hex').slice(0, 32);
  return !!sig && sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}

export async function getContact(email) {
  try { return await api('GET', `/contacts/${encodeURIComponent(email)}`); }
  catch (e) { if (e.status === 404) return null; throw e; }
}

export async function addContact(email, { unsubscribed, segment, properties }) {
  const existing = await getContact(email);
  if (existing) {
    await api('PATCH', `/contacts/${encodeURIComponent(email)}`, { properties, ...(unsubscribed ? { unsubscribed: true } : {}) });
    try { await api('POST', `/contacts/${encodeURIComponent(email)}/segments/${segment}`); } catch (e) { if (e.status !== 409 && e.status !== 422) throw e; }
    return existing;
  }
  return api('POST', '/contacts', { email, unsubscribed, properties, segments: [{ id: segment }] });
}

export async function setUnsubscribed(email) {
  return api('PATCH', `/contacts/${encodeURIComponent(email)}`, { unsubscribed: true });
}

export async function sendWelcome(email) {
  const unsub = unsubscribeUrl(email);
  const fill = (s) => s.split('{{unsubscribe_url}}').join(unsub);
  const res = await api('POST', '/emails', {
    from: FROM,
    to: [email],
    reply_to: REPLY_TO,
    subject: 'Welcome to AI in the Courts',
    html: fill(T('welcome.html')),
    text: fill(T('welcome.txt')),
    headers: {
      'List-Unsubscribe': `<${unsub}>, <mailto:${REPLY_TO}?subject=No%20updates>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tags: [{ name: 'list', value: 'ai_in_the_courts' }, { name: 'step', value: 'welcome' }],
  }, { 'Idempotency-Key': `aiic-welcome-${hash(email)}` });
  return res.id;
}
