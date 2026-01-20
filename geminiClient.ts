// geminiClient.ts
// Tích hợp Google Gemini API cho phân tích AI

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function analyzeWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  if (!res.ok) throw new Error('Gemini API error: ' + res.statusText);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
