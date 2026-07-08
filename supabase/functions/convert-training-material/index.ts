type Material = {
  id: string;
  course_id: string;
  title: string;
  extracted_text: string | null;
};

type GeneratedQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
};

type GeneratedSection = {
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
  quickQuestion?: GeneratedQuestion;
};

type GeneratedCourse = {
  courseSummary: string;
  sections: GeneratedSection[];
  finalQuestions: GeneratedQuestion[];
};

declare const Deno: { env: { get(name: string): string | undefined } };

const FINAL_QUESTION_COUNT = 20;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    let materialId = "";
    try {
      const body = await req.json();
      materialId = String(body.material_id || "").trim();
      if (!materialId) return json({ error: "Thieu material_id" }, 400);

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = getSupabaseServiceKey();
      if (!supabaseUrl || !serviceKey) return json({ error: "Thieu SUPABASE_URL hoac service role key. Hay set SUPABASE_SERVICE_ROLE_KEY hoac dung SUPABASE_SECRET_KEYS mac dinh cua Supabase." }, 500);

      const client = createRestClient(supabaseUrl, serviceKey);
      await client.patch(`training_materials?id=eq.${encodeURIComponent(materialId)}`, { convert_status: "processing" });

      const materials = await client.get<Material[]>(`training_materials?id=eq.${encodeURIComponent(materialId)}&select=*`);
      const material = materials[0];
      if (!material) return json({ error: "Khong tim thay tai lieu" }, 404);

      const text = normalizeText(material.extracted_text || "");
      if (!text) {
        await client.patch(`training_materials?id=eq.${encodeURIComponent(materialId)}`, { convert_status: "uploaded_no_text" });
        return json({ error: "Tai lieu chua co text de chuyen doi" }, 422);
      }

      const aiResult = await generateCourseWithAI(text, material.title).catch((error) => {
        console.error("AI conversion failed, fallback to local sectioning", error);
        return null;
      });
      const sections = aiResult?.sections?.length ? aiResult.sections : buildSections(text, material.title);
      const finalQuestions = ensureTwentyFinalQuestions(aiResult?.finalQuestions || [], sections);

      await client.delete(`training_questions?course_id=eq.${encodeURIComponent(material.course_id)}`);
      await client.delete(`training_practice_checklists?course_id=eq.${encodeURIComponent(material.course_id)}`);
      await client.delete(`training_lessons?material_id=eq.${encodeURIComponent(material.id)}`);

      const lessons = await client.post<any[]>("training_lessons?select=*", sections.map((section, index) => ({
        course_id: material.course_id,
        material_id: material.id,
        title: section.title,
        content: section.content,
        summary: section.summary,
        key_points: section.keyPoints,
        lesson_order: index + 1,
        estimated_minutes: Math.max(3, Math.ceil(section.content.length / 900)),
        section_type: "lesson",
      })));

      const quickQuestions = lessons.map((lesson, index) => makeQuestion({
        courseId: material.course_id,
        lessonId: lesson.id,
        section: sections[index],
        source: "ai_quick",
        sortOrder: index + 1,
      }));
      const finalQuestionRows = finalQuestions.map((question, index) => makeQuestion({
        courseId: material.course_id,
        lessonId: lessons[index % Math.max(lessons.length, 1)]?.id || lessons[0]?.id,
        section: sections[index % Math.max(sections.length, 1)],
        source: "ai_final_test",
        sortOrder: index + 1,
        generated: question,
      }));
      const questions = [...quickQuestions, ...finalQuestionRows];
      if (questions.length) await client.post("training_questions", questions);

      const checklists = lessons.map((lesson, index) => ({
        course_id: material.course_id,
        material_id: material.id,
        lesson_id: lesson.id,
        title: `Thuc hanh: ${lesson.title}`,
        items: sections[index].keyPoints.map((point) => ({ label: point, required: true })),
      }));
      if (checklists.length) await client.post("training_practice_checklists", checklists);

      await client.patch(`training_materials?id=eq.${encodeURIComponent(material.id)}`, {
        convert_status: aiResult ? "converted_ai" : "converted_fallback",
        ai_raw_json: {
          provider: aiResult ? "gemini" : "local_fallback",
          course_summary: aiResult?.courseSummary || null,
          sections: sections.length,
          quick_questions: quickQuestions.length,
          final_questions: finalQuestionRows.length,
        },
      });

      return json({
        ok: true,
        provider: aiResult ? "gemini" : "local_fallback",
        lessons: lessons.length,
        quick_questions: quickQuestions.length,
        final_questions: finalQuestionRows.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (materialId) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const serviceKey = getSupabaseServiceKey();
          if (supabaseUrl && serviceKey) {
            await createRestClient(supabaseUrl, serviceKey).patch(`training_materials?id=eq.${encodeURIComponent(materialId)}`, { convert_status: "failed" });
          }
        } catch (statusError) {
          console.error("Could not mark conversion failed", statusError);
        }
      }
      return json({ error: message }, 500);
    }
  },
};

function getSupabaseServiceKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return undefined;

  try {
    const parsed = JSON.parse(secretKeys);
    return parsed?.default || Object.values(parsed || {})[0] as string | undefined;
  } catch {
    return undefined;
  }
}
function createRestClient(supabaseUrl: string, serviceKey: string) {
  const baseUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };

  async function request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}/${path}`, {
      ...init,
      headers: { ...headers, Prefer: "return=representation", ...(init.headers || {}) },
    });
    const bodyText = await response.text();
    const body = bodyText ? JSON.parse(bodyText) : null;
    if (!response.ok) throw new Error(body?.message || bodyText || `HTTP ${response.status}`);
    return body as T;
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}

async function generateCourseWithAI(text: string, title: string): Promise<GeneratedCourse | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
  if (!apiKey) return null;
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";

  const prompt = `Ban la chuyen gia dao tao y te. Hay chuyen quy trinh goc thanh bai giang e-learning bang tieng Viet.

Tra ve JSON hop le, khong markdown:
{
  "courseSummary": "tom tat toan khoa 2-4 cau",
  "sections": [
    {
      "title": "ten section ngan",
      "summary": "tom tat section 1-2 cau",
      "content": "noi dung bai hoc ro rang, co buoc thuc hien, luu y an toan/chat luong",
      "keyPoints": ["y chinh 1", "y chinh 2", "y chinh 3"],
      "quickQuestion": {"question":"...", "options":["...","...","...","..."], "correctAnswerIndex":0, "explanation":"..."}
    }
  ],
  "finalQuestions": [
    {"question":"...", "options":["...","...","...","..."], "correctAnswerIndex":0, "explanation":"..."}
  ]
}

Quy tac bat buoc:
- Tao 4 den 8 sections theo trinh tu logic cua quy trinh.
- Moi section co 1 quickQuestion dung 4 lua chon.
- Noi dung section trong truong content phai trinh bay thanh nhieu dong ngan; moi y bat dau bang "- " hoac "+ ". Dung "- " cho buoc/noi dung chinh, "+ " cho luu y, canh bao, ho so, minh chung.
- finalQuestions phai co DUNG ${FINAL_QUESTION_COUNT} cau hoi kiem tra cuoi khoa.
- Moi cau hoi co dung 4 lua chon, correctAnswerIndex la so 0-3.
- Khong bia thong tin ngoai tai lieu; neu tai lieu thieu, viet theo huong "can kiem tra quy trinh goc".

Ten tai lieu: ${title}

Noi dung quy trinh:
${text.slice(0, 26000)}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) throw new Error(bodyText || `Gemini HTTP ${response.status}`);
  const body = JSON.parse(bodyText);
  const generatedText = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!generatedText) throw new Error("Gemini did not return course content");

  const parsed = JSON.parse(stripCodeFence(generatedText));
  const sections = Array.isArray(parsed.sections) ? parsed.sections.map(normalizeGeneratedSection).filter(Boolean) as GeneratedSection[] : [];
  if (!sections.length) throw new Error("AI did not create valid sections");
  const finalQuestions = Array.isArray(parsed.finalQuestions) ? parsed.finalQuestions.map(normalizeQuestion).filter(Boolean) as GeneratedQuestion[] : [];
  return { courseSummary: String(parsed.courseSummary || "").trim(), sections, finalQuestions };
}

function normalizeGeneratedSection(section: any): GeneratedSection | null {
  const title = String(section?.title || "").trim();
  const content = String(section?.content || "").trim();
  if (!title || !content) return null;
  return {
    title,
    content,
    summary: String(section.summary || content.slice(0, 260)).trim(),
    keyPoints: normalizeStringList(section.keyPoints).slice(0, 6),
    quickQuestion: normalizeQuestion(section.quickQuestion),
  };
}

function normalizeQuestion(question: any): GeneratedQuestion | undefined {
  if (!question) return undefined;
  const options = normalizeStringList(question.options).slice(0, 4);
  const correctAnswerIndex = Number(question.correctAnswerIndex ?? 0);
  if (!question.question || options.length !== 4 || correctAnswerIndex < 0 || correctAnswerIndex > 3) return undefined;
  return {
    question: String(question.question).trim(),
    options,
    correctAnswerIndex,
    explanation: String(question.explanation || options[correctAnswerIndex] || "").trim(),
  };
}

function normalizeStringList(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function buildSections(text: string, fallbackTitle: string): GeneratedSection[] {
  const paragraphs = text.split(/\n{2,}|(?<=\.)\s+(?=[A-ZÀ-Ỵ])/).map((item) => item.trim()).filter((item) => item.length > 40);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if ((current + " " + paragraph).length > 1800 && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = `${current} ${paragraph}`.trim();
    }
  }
  if (current) chunks.push(current.trim());
  const selected = chunks.length ? chunks.slice(0, 8) : [text.slice(0, 1800)];
  return selected.map((content, index) => {
    const firstSentence = content.split(/[.!?]\s/)[0]?.trim() || fallbackTitle;
    const title = firstSentence.length > 90 ? `${firstSentence.slice(0, 87)}...` : firstSentence;
    return { title: title || `${fallbackTitle} - Phan ${index + 1}`, content, summary: content.slice(0, 260), keyPoints: extractKeyPoints(content) };
  });
}

function extractKeyPoints(content: string) {
  const sentences = content.split(/[.!?]\s/).map((item) => item.trim()).filter((item) => item.length > 30);
  return sentences.slice(0, 4).map((sentence) => sentence.replace(/^[-•\d.)\s]+/, "").slice(0, 180));
}

function ensureTwentyFinalQuestions(questions: GeneratedQuestion[], sections: GeneratedSection[]) {
  const normalized = questions.slice(0, FINAL_QUESTION_COUNT);
  let index = 0;
  while (normalized.length < FINAL_QUESTION_COUNT) {
    const section = sections[index % Math.max(sections.length, 1)];
    normalized.push(buildFallbackQuestion(section, normalized.length + 1));
    index += 1;
  }
  return normalized;
}

function buildFallbackQuestion(section: GeneratedSection | undefined, order: number): GeneratedQuestion {
  const title = section?.title || `Noi dung ${order}`;
  const answer = section?.keyPoints?.[0] || section?.summary || title;
  return {
    question: `Cau ${order}: Noi dung trong tam cua "${title}" la gi?`,
    options: [answer, "Bo qua buoc danh gia va ghi nhan ket qua", "Chi thuc hien khi co yeu cau dot xuat", "Khong can theo doi sau khi trien khai"],
    correctAnswerIndex: 0,
    explanation: answer,
  };
}

function makeQuestion({ courseId, lessonId, section, source, sortOrder, generated }: {
  courseId: string;
  lessonId: string;
  section: GeneratedSection;
  source: string;
  sortOrder: number;
  generated?: GeneratedQuestion;
}) {
  const question = generated || (source === "ai_quick" ? section.quickQuestion : undefined) || buildFallbackQuestion(section, sortOrder);
  return {
    course_id: courseId,
    lesson_id: lessonId,
    question_text: question.question,
    question_type: "single_choice",
    options: question.options,
    correct_answer: String(question.correctAnswerIndex),
    correct_answer_index: question.correctAnswerIndex,
    explanation: question.explanation || question.options[question.correctAnswerIndex],
    source,
    sort_order: sortOrder,
    difficulty: source === "ai_final_test" ? "final" : "quick",
  };
}

function normalizeText(value: string) {
  return value.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function stripCodeFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}
