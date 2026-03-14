// geminiClient.ts
// Tích hợp Google Gemini API cho phân tích AI với Multi-Key Rotation & Smart Retry

// Support multiple API keys - add more keys separated by comma in .env.local
const GEMINI_API_KEYS = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',').filter((k: string) => k.trim());

// Priority model configurations to try - focusing on stable endpoints
const MODEL_CONFIGS = [
  { version: 'v1', name: 'gemini-1.5-flash' },
  { version: 'v1beta', name: 'gemini-2.0-flash' },
  { version: 'v1', name: 'gemini-1.5-pro' },
  { version: 'v1beta', name: 'gemini-2.0-flash-lite-preview-02-05' }
];

let currentKeyIndex = 0;

function getCurrentKey(): string | null {
  if (GEMINI_API_KEYS.length === 0) return null;
  return GEMINI_API_KEYS[currentKeyIndex].trim();
}

function rotateKey() {
  if (GEMINI_API_KEYS.length > 0) {
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  }
}

export async function analyzeWithGemini(prompt: string, retryCount = 0): Promise<string> {
  if (GEMINI_API_KEYS.length === 0) throw new Error('Vui lòng thêm VITE_GEMINI_API_KEY vào file .env.local');

  const totalConfigs = MODEL_CONFIGS.length;
  const totalKeys = GEMINI_API_KEYS.length;
  const maxRetries = Math.min(totalKeys * totalConfigs, 20);

  const apiKey = getCurrentKey();
  if (!apiKey) throw new Error('Không tìm thấy API Key hợp lệ');

  // Rotate configuration
  const config = MODEL_CONFIGS[retryCount % totalConfigs];
  const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.name}:generateContent?key=${apiKey}`;

  console.log(`[Gemini AI] Lần thử ${retryCount + 1}/${maxRetries} | Model: ${config.name} | Key: ${currentKeyIndex + 1}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || res.statusText || 'Unknown error';
      const lowerError = errorMessage.toLowerCase();

      // IMPORTANT: Rotate key for NEXT retry
      rotateKey();

      const isRetryable =
        lowerError.includes('quota') ||
        lowerError.includes('rate limit') ||
        lowerError.includes('not found') ||
        lowerError.includes('not supported') ||
        lowerError.includes('overloaded') ||
        res.status === 429 ||
        res.status === 404 ||
        res.status === 503;

      if (isRetryable && retryCount < maxRetries) {
        console.warn(`[Gemini AI] Lỗi ${res.status} (${config.name}): ${errorMessage}. Đang thử Key/Model khác...`);
        
        // Wait longer for rate limits
        if (res.status === 429 || lowerError.includes('rate limit')) {
          await new Promise(r => setTimeout(r, 2000));
        }
        
        return analyzeWithGemini(prompt, retryCount + 1);
      }

      throw new Error(`Gemini API error (${config.name}): ${errorMessage}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      if (retryCount < maxRetries) {
        rotateKey();
        return analyzeWithGemini(prompt, retryCount + 1);
      }
      throw new Error('AI không trả về nội dung. Có thể do nội dung bị bộ lọc an toàn chặn.');
    }

    return text;
  } catch (error: any) {
    if (retryCount < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
      rotateKey();
      return analyzeWithGemini(prompt, retryCount + 1);
    }
    throw error;
  }
}
