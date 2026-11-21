// POST /api/subscribe: AI in the Courts signup with recorded consent, then the welcome email.
import { CONSENT_TEXT, CONSENT_VERSION, SEGMENT_ID, SUPPRESSION_SEGMENT_ID, SITE, suppressionReason, getContact, addContact, sendWelcome } from '../lib/newsletter.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORIGINS = [SITE, SITE.replace('https://', 'https://www.')];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const origin = req.headers.origin || '';
  if (origin && !ORIGINS.includes(origin) && !/^https:\/\/legalprecision-hub-[a-z0-9-]+\.vercel\.app$/.test(origin)) return res.status(403).json({ error: 'origin' });

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b || '{}'); } catch { return res.status(400).json({ error: 'body' }); } }
  if (b.company) return res.status(200).json({ ok: true }); // honeypot
  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'email' });
  if (b.consent !== true) return res.status(400).json({ error: 'consent' }); // no consent, no contact, no email

  let page = `${SITE}/`;
  try { const u = new URL(String(b.page || '')); page = SITE + u.pathname; } catch {}
  const textMatches = String(b.consent_text || '').trim() === CONSENT_TEXT;
  const now = new Date().toISOString();
  const props = {
    consent_at: now, consent_page: page, consent_text: CONSENT_TEXT,
    consent_version: CONSENT_VERSION + (textMatches ? '' : ' (client text mismatch)'),
    consent_source: 'legalprecision.ai signup form',
  };

  try {
    const existing = await getContact(email);
    if (existing && existing.unsubscribed) return res.status(200).json({ ok: true }); // opted out or suppressed: never re-add silently

    const held = suppressionReason(email);
    if (held) {
      await addContact(email, { unsubscribed: true, segment: SUPPRESSION_SEGMENT_ID, properties: { ...props, signup_held: 'yes', suppression_reason: held } });
      console.log('signup held for review', held);
      return res.status(200).json({ ok: true });
    }

    if (existing && existing.properties && existing.properties.welcome_email_id) return res.status(200).json({ ok: true }); // already welcomed
    await addContact(email, { unsubscribed: false, segment: SEGMENT_ID, properties: props });
    const id = await sendWelcome(email);
    await addContact(email, { unsubscribed: false, segment: SEGMENT_ID, properties: { welcome_email_id: id } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('subscribe failed', e.message);
    return res.status(502).json({ error: 'send' });
  }
}
