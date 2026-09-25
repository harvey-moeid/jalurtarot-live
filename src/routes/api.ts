import { Hono } from 'hono';
import { generateInterpretation, generateDailyInterpretation, generateFollowUp } from '../lib/interpret';
import type { DrawnCard, Spread } from '../lib/types';

// ★ Jalur Tarot Live — 100% offline/lokal, tanpa AI/LLM.
// Semua interpretasi dihasilkan dari data statis di repo (lib/cards.ts,
// lib/enrichedMeanings.ts, lib/interpret.ts). Tidak ada panggilan ke API luar,
// tidak ada sistem kredit — ramalan gratis & tanpa batas.
export type Env = {
  RATE_LIMIT_KV: KVNamespace;
};

const api = new Hono<{ Bindings: Env }>();

// ── GET /api/config — status statis, dipertahankan untuk kompatibilitas frontend ──
api.get('/config', (c) => {
  return c.json({
    fallbackAvailable: false,
    rateLimit: 0,
    ratePeriodDays: 0,
    staticMode: true,
  });
});

// ── GET /api/daily-bonus — sistem kredit dihapus, ramalan selalu gratis ──
api.get('/daily-bonus', (c) => {
  return c.json({ enabled: false, alreadyClaimed: true, remaining: 999 });
});

// ── POST /api/claim-daily — sistem kredit dihapus ──
api.post('/claim-daily', (c) => {
  return c.json({ success: false, alreadyClaimed: true, remaining: 999, message: 'Ramalan sekarang gratis tanpa batas' });
});

// ── Helpers validasi ──
function isValidString(v: unknown, maxLen = 2000): boolean {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen;
}
function isValidCard(dc: any): boolean {
  return dc && typeof dc.card === 'object' && typeof dc.card.id === 'string'
    && typeof dc.isReversed === 'boolean'
    && dc.position && typeof dc.position.id === 'string';
}

// ── SSE statis — format dipertahankan agar kompatibel dengan frontend yang sudah ada ──
function staticFallbackStream(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const chunks = text.split('\n');
      let i = 0;
      function sendNext() {
        if (i >= chunks.length) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }
        const payload = JSON.stringify({ choices: [{ delta: { content: chunks[i++] + '\n' } }] });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        setTimeout(sendNext, 20);
      }
      sendNext();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Static-Mode': 'true' },
  });
}

// ── POST /api/interpret — 100% lokal, tanpa AI, memakai data kartu dari repo ──
api.post('/interpret', async (c) => {
  let body: any;
  try { body = await c.req.json(); }
  catch { return c.json({ error: 'Format JSON tidak valid' }, 400 as any); }

  const { question, spread, drawnCards, followUp, daily, tone } = body;

  if (!daily && !followUp) {
    if (!isValidString(question, 1000)) {
      return c.json({ error: 'Pertanyaan tidak boleh kosong (maks 1000 karakter)' }, 400 as any);
    }
    if (!spread || typeof spread.id !== 'string' || !Array.isArray(spread.positions)) {
      return c.json({ error: 'Susunan kartu tidak valid' }, 400 as any);
    }
    if (!Array.isArray(drawnCards) || drawnCards.length === 0 || drawnCards.length > 15) {
      return c.json({ error: 'Jumlah kartu tidak valid (1–15)' }, 400 as any);
    }
    if (!drawnCards.every(isValidCard)) {
      return c.json({ error: 'Data kartu tidak valid' }, 400 as any);
    }
  }
  if (followUp && !isValidString(followUp.followUpQuestion, 500)) {
    return c.json({ error: 'Pertanyaan lanjutan tidak valid' }, 400 as any);
  }
  if (tone && !['spiritual', 'praktis', 'puitis'].includes(tone)) {
    return c.json({ error: 'Gaya tidak valid' }, 400 as any);
  }

  const safeTone = (tone && ['spiritual', 'praktis', 'puitis'].includes(tone)) ? tone : 'spiritual';
  let text = '';

  if (daily) {
    const cardObj = daily.card || {
      id: daily.cardName || '',
      name: daily.cardName || '',
      nameCn: daily.cardNameCn || '',
      keywords: { upright: daily.keywords || [], reversed: daily.keywords || [] },
      meaning: { upright: daily.meaning || '', reversed: daily.meaning || '' },
    };
    const today = new Date();
    const dateKey = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    text = generateDailyInterpretation(cardObj as any, daily.isReversed, dateKey);
  } else if (followUp) {
    text = generateFollowUp(followUp.followUpQuestion, drawnCards, spread, safeTone);
  } else {
    text = generateInterpretation(question, spread as Spread, drawnCards as DrawnCard[], safeTone);
  }

  return staticFallbackStream(text);
});

export default api;
