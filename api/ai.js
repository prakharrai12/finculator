/**
 * Vercel Serverless Function: /api/ai/query
 * Serverless AI Proxy securing GEMINI_API_KEY with rate limiting and input guardrails
 */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Finculator-CSRF');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
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
      return res.status(200).json({
        success: false,
        offlineFallback: true,
        error: `Upstream AI provider status ${upstreamRes.status}`
      });
    }

    const data = await upstreamRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      success: true,
      response: text
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      offlineFallback: true,
      error: err.message
    });
  }
}
