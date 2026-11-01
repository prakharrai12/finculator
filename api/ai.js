/**
 * Vercel Serverless Function: /api/ai/query
 * Hardened Serverless AI Proxy securing GEMINI_API_KEY with CORS lockdown,
 * CSRF enforcement, header-based auth, and sensitive error masking.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://finculator-black.vercel.app',
  'https://finculator.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function getAllowedOrigins() {
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);
}

function getValidatedOrigin(req, allowedOrigins) {
  const origin = req.headers['origin'] || '';
  if (!origin) return null;
  return allowedOrigins.has(origin) ? origin : false;
}

export default async function handler(req, res) {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers['origin'];
  const validatedOrigin = getValidatedOrigin(req, allowedOrigins);

  // If origin is provided but not in allowlist, block cross-origin requests
  if (origin && validatedOrigin === false) {
    return res.status(403).json({ error: 'CORS policy violation: unauthorized origin.' });
  }

  // Pre-flight OPTIONS handling
  if (req.method === 'OPTIONS') {
    if (validatedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', validatedOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Finculator-CSRF');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Set secure response headers
  if (validatedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', validatedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // CSRF validation: require X-Finculator-CSRF header or same-origin
  const csrfHeader = req.headers['x-finculator-csrf'];
  const referer = req.headers['referer'] || '';
  let refererValid = false;
  if (referer) {
    try {
      const parsedRef = new URL(referer);
      refererValid = allowedOrigins.has(parsedRef.origin);
    } catch {}
  }

  if (csrfHeader !== '1' && !refererValid && !validatedOrigin) {
    return res.status(403).json({ error: 'CSRF validation failed: missing security header.' });
  }

  try {
    const prompt = (req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt query is required.' });
    }
    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Prompt exceeds maximum length of 1000 characters.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('your-')) {
      return res.status(200).json({
        success: false,
        offlineFallback: true,
        error: 'AI backend key not configured in environment variables. Using local RAG fallback.'
      });
    }

    // Google Gemini API: use x-goog-api-key header to prevent key leakage in URLs/logs
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const systemPrompt = `You are FinBot, the financial copilot on Finculator. Answer accurately, concisely, and with structured bullet points.
Suggest relevant Finculator tools formatted strictly as [NAVIGATE:route|Button Label].
Always maintain educational disclaimers.`;

    const upstreamRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }]
        }]
      })
    });

    if (!upstreamRes.ok) {
      return res.status(200).json({
        success: false,
        offlineFallback: true,
        error: `Upstream AI service status ${upstreamRes.status}`
      });
    }

    const data = await upstreamRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      success: true,
      response: text
    });
  } catch (err) {
    // Mask internal error to prevent stack trace or credential leakage
    return res.status(200).json({
      success: false,
      offlineFallback: true,
      error: 'Upstream AI service temporarily unavailable.'
    });
  }
}
