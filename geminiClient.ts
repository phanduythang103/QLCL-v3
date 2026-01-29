// geminiClient.ts
// Tích hợp Google Gemini API cho phân tích AI với Multi-Key Rotation

// Support multiple API keys - add more keys separated by comma in .env.local
// Example: VITE_GEMINI_API_KEY=key1,key2,key3
const GEMINI_API_KEYS = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',').filter((k: string) => k.trim());

// Use gemini-2.0-flash for faster responses and better availability
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Track current key index for rotation
let currentKeyIndex = 0;

function getNextKey(): string | null {
  if (GEMINI_API_KEYS.length === 0) return null;
  const key = GEMINI_API_KEYS[currentKeyIndex].trim();
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

export async function analyzeWithGemini(prompt: string, retryCount = 0): Promise<string> {
  if (GEMINI_API_KEYS.length === 0) throw new Error('GEMINI_API_KEY is not set');

  const apiKey = getNextKey();
  if (!apiKey) throw new Error('No valid API key available');

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || res.statusText || 'Unknown error';

    // If quota exceeded and we have more keys, try next key
    if (errorMessage.includes('quota') && retryCount < GEMINI_API_KEYS.length - 1) {
      console.warn(`Key ${retryCount + 1} quota exceeded, trying next key...`);
      return analyzeWithGemini(prompt, retryCount + 1);
    }

    console.error('Gemini API Error:', errorData);
    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
