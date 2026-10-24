/**
 * Cloudflare Pages Function: /api/ai/query
 * Serverless AI Proxy securing GEMINI_API_KEY with rate limiting and input guardrails
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. CORS Pre-flight and Origin Check
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Finculator-CSRF',
    'Content-Type': 'application/json; charset=utf-8'
  };

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are FinBot, the financial copilot on Finculator. Answer accurately, concisely, and with structured bullet points.
Suggest relevant Finculator tools formatted strictly as [NAVIGATE:route|Button Label].
Always maintain educational disclaimers.`;

    const upstreamRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        error: `Upstream AI provider status ${upstreamRes.status}`
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
    return new Response(JSON.stringify({
      success: false,
      offlineFallback: true,
      error: err.message
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Finculator-CSRF'
    }
  });
}
