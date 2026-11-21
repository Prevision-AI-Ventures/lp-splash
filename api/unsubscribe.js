// GET or POST /api/unsubscribe?e=<email>&s=<signature>. POST is the RFC 8058 one-click path.
import { verifyUnsub, setUnsubscribed } from '../lib/newsletter.js';

export default async function handler(req, res) {
  const email = String((req.query && req.query.e) || '').trim().toLowerCase();
  const sig = String((req.query && req.query.s) || '');
  if (!email || !verifyUnsub(email, sig)) return res.status(400).send('This unsubscribe link is not valid. Reply "No updates" to any email and we will remove you.');
  try { await setUnsubscribed(email); }
  catch (e) { console.error('unsubscribe failed', e.message); return res.status(500).send('Something went wrong. Reply "No updates" to any email and we will remove you.'); }
  if (req.method === 'POST') return res.status(200).send('ok');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed | LegalPrecision AI</title>
<body style="margin:0;background:#F7F5F0;color:#182C39;font-family:Switzer,Arial,Helvetica,sans-serif">
<main style="max-width:560px;margin:12vh auto;padding:0 24px">
<p style="font-family:Zodiak,Georgia,serif;font-size:24px;margin:0">LegalPrecision AI</p>
<h1 style="font-family:Zodiak,Georgia,serif;font-weight:400;font-size:32px;margin:28px 0 12px">You're unsubscribed.</h1>
<p style="color:#52616A;line-height:1.6">You won't get more emails from LegalPrecision AI. Changed your mind? Write to precision-ai-ventures@proton.me.</p>
</main></body></html>`);
}
