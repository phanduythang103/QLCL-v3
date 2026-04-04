import { supabase } from './supabaseClient';
import { getActivePrompt } from './readCauHinhAi';

export interface AiRequestOptions {
  moduleKey?: string;
  temperature?: number;
  maxTokens?: number;
}

// Fallback keys from environment
const FALLBACK_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Lấy cấu hình AI đang hoạt động từ Database
 */
async function getActiveAiConfig() {
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_ai')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Hàm phân tích chung hỗ trợ cả Gemini và GPT
 */
export async function analyzeWithAi(prompt: string, options: AiRequestOptions = {}, retryCount = 0): Promise<string> {
  try {
    const config = await getActiveAiConfig();
    const systemPrompt = options.moduleKey ? await getActivePrompt(options.moduleKey) : null;
    
    // Trường hợp dùng Google Gemini (Mặc định hoặc cấu hình chọn Google)
    if (!config || config.provider === 'Google') {
      const apiKey = config?.api_key || FALLBACK_GEMINI_KEY;
      const model = config?.model_name || 'gemini-1.5-flash';
      
      if (!apiKey) throw new Error('Vui lòng cấu hình API Key cho AI trong Cấu hình hệ thống.');

      // Tự động chọn version phù hợp: v1beta cho 2.0 hoặc preview, v1 cho stable 1.5
      const apiVersion = (model.includes('2.0') || model.includes('preview')) ? 'v1beta' : 'v1';
      
      // Đảm bảo model name không bị lặp prefix 'models/' nếu DB đã lưu cả prefix
      const cleanModel = model.replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${cleanModel}:generateContent?key=${apiKey}`;

      const body: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature || 0.1, 
          maxOutputTokens: options.maxTokens || 2048,
          responseMimeType: "application/json" 
        }
      };

      if (systemPrompt) {
        body.system_instruction = { parts: [{ text: systemPrompt }] };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${errorData?.error?.message || res.statusText}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Trường hợp dùng OpenAI GPT
    if (config.provider === 'OpenAI') {
      const apiKey = config.api_key;
      const model = config.model_name || 'gpt-4o';

      const url = 'https://api.openai.com/v1/chat/completions';

      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          response_format: { type: "json_object" },
          temperature: options.temperature || 0.1,
          max_tokens: options.maxTokens || 2048
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData?.error?.message || res.statusText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    return '';
  } catch (error: any) {
    if (retryCount < 2) return analyzeWithAi(prompt, options, retryCount + 1);
    throw error;
  }
}
