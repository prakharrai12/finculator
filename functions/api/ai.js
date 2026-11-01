/**
 * Cloudflare Pages Function: /api/ai/query
 * Hardened Serverless AI Proxy securing GEMINI_API_KEY with CORS lockdown,
 * CSRF enforcement, header-based auth, and sensitive error masking.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://finculator-black.vercel.app',
  'https://finculator.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function getAllowedOrigins(env) {
  const envOrigins = (env?.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const origin = request.headers.get('Origin') || '';
  const isAllowedOrigin = origin && allowedOrigins.has(origin);

  if (origin && !isAllowedOrigin) {
    return new Response(JSON.stringify({ error: 'CORS policy violation: unauthorized origin.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (isAllowedOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
    corsHeaders['Vary'] = 'Origin';
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    corsHeaders['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, X-Finculator-CSRF';
  }

  // CSRF validation
  const csrfHeader = request.headers.get('X-Finculator-CSRF');
  const referer = request.headers.get('Referer') || '';
  let refererValid = false;
  if (referer) {
    try {
      const parsedRef = new URL(referer);
      refererValid = allowedOrigins.has(parsedRef.origin);
    } catch {}
  }

  if (csrfHeader !== '1' && !refererValid && !isAllowedOrigin) {
    return new Response(JSON.stringify({ error: 'CSRF validation failed: missing security header.' }), {
      status: 403,
      headers: corsHeaders
    });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const prompt = (payload.prompt || '').trim();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt query is required.' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (prompt.length > 1000) {
      return new Response(JSON.stringify({ error: 'Prompt exceeds maximum length of 1000 characters.' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('your-')) {
      return new Response(JSON.stringify({
        success: false,
        offlineFallback: true,
        error: 'AI backend key not configured in environment variables. Using local RAG fallback.'
      }), {
        status: 200,
        headers: corsHeaders
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
      return new Response(JSON.stringify({
        success: false,
        offlineFallback: true,
        error: `Upstream AI service status ${upstreamRes.status}`
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    const data = await upstreamRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({
      success: true,
      response: text
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    // Mask internal error to prevent stack trace or credential leakage
    return new Response(JSON.stringify({
      success: false,
      offlineFallback: true,
      error: 'Upstream AI service temporarily unavailable.'
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions(context) {
  const { request, env } = context;
  const allowedOrigins = getAllowedOrigins(env);
  const origin = request.headers.get('Origin') || '';

  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Finculator-CSRF'
  };

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new Response(null, {
    status: 204,
    headers
  });
}
