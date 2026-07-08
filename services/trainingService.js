import { supabase } from './supabaseClient';
import { extractTextFromFile } from '../utils/extractTextFromFile';

const TRAINING_BUCKET = 'training-materials';

export async function getTrainingCourses() {
  const { data, error } = await supabase
    .from('training_courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTrainingCourse(record) {
  const title = String(record.title || '').trim();
  if (!title) throw new Error('Vui lòng nhập tên khóa học');

  const { data, error } = await supabase
    .from('training_courses')
    .insert({
      title,
      description: String(record.description || '').trim(),
      status: 'draft',
      duration_minutes: Number(record.duration_minutes || 0) || null,
      created_by: record.created_by || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function readJsonFile(file, label) {
  if (!file) throw new Error(`Chưa chọn file ${label}`);
  const text = await file.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    throw new Error(`File ${label} không phải JSON hợp lệ`);
  }
}

function toText(value) {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean).join('\n');
  return String(value || '').trim();
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/\n|\||;/).map(item => item.trim()).filter(Boolean);
  return [];
}

function getSectionRows(lessonJson, courseId, materialId) {
  const rawSections = lessonJson.sections || lessonJson.lessons || lessonJson.lesson_sections || lessonJson.items || [];
  if (!Array.isArray(rawSections) || rawSections.length === 0) throw new Error('lesson_json phải có mảng sections');

  return rawSections.map((section, index) => {
    const title = String(section.title || section.section_title || section.sectionTitle || section.name || section.heading || section.ten_section || `Section ${index + 1}`).trim();
    const objectives = normalizeStringArray(section.learning_objectives || section.objectives || section.muc_tieu || section.learningGoals);
    const keyPoints = normalizeStringArray(section.key_points || section.keyPoints || section.points || section.bullets || section.learning_points);
    const stepLines = normalizeStringArray(section.steps || section.activities || section.procedure || section.actions).map(item => `- ${item}`);
    const noteLines = normalizeStringArray(section.practice_notes || section.notes || section.warnings || section.reminders || section.luu_y).map(item => `+ ${item}`);
    const quickChecks = Array.isArray(section.quick_check_questions) ? section.quick_check_questions.map(item => {
      if (item && typeof item === 'object') return `+ Câu hỏi nhanh: ${item.question || ''}${item.answer ? ` | Đáp án: ${item.answer}` : ''}`.trim();
      return `+ Câu hỏi nhanh: ${String(item || '').trim()}`;
    }).filter(Boolean) : [];
    const summary = toText(section.summary || section.description || section.tom_tat || section.overview);
    const mainContent = toText(section.main_content || section.mainContent || section.noi_dung_chinh);
    const rawContent = toText(section.content || section.content_markdown || section.markdown || section.body || section.lesson_content || section.section_content || section.text || section.noi_dung || section.detail || section.details);
    const structuredContent = [
      ...objectives.map(item => `- Mục tiêu: ${item}`),
      mainContent && `- Nội dung chính: ${mainContent}`,
      ...keyPoints.map(item => `- Ý chính: ${item}`),
      ...stepLines,
      ...noteLines,
      ...quickChecks,
    ].filter(Boolean).join('\n');
    const fallbackContent = [summary, structuredContent].filter(Boolean).join('\n');
    const content = rawContent ? [rawContent, structuredContent].filter(Boolean).join('\n') : (fallbackContent || `- ${title}`);
    return {
      course_id: courseId,
      material_id: materialId,
      title,
      content,
      summary: summary || content.slice(0, 260),
      key_points: keyPoints,
      lesson_order: Number(section.lesson_order || section.order || section.section_order || index + 1),
      estimated_minutes: Math.max(3, Number(section.estimated_minutes || section.duration_minutes || 0) || Math.ceil(content.length / 900)),
      section_type: 'lesson',
    };
  });
}

function normalizeQuestionOptions(question) {
  const source = question.options || question.choices || question.answers || question.lua_chon || question.dap_an || question.phuong_an;
  if (Array.isArray(source)) {
    return source.map(item => {
      if (item && typeof item === 'object') return String(item.text || item.label || item.value || item.answer || '').trim();
      return String(item || '').trim();
    }).filter(Boolean).slice(0, 4);
  }

  if (source && typeof source === 'object') {
    const orderedKeys = ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd', '0', '1', '2', '3'];
    const ordered = orderedKeys.map(key => source[key]).filter(value => value != null);
    const values = ordered.length ? ordered : Object.values(source);
    return values.map(item => {
      if (item && typeof item === 'object') return String(item.text || item.label || item.value || item.answer || '').trim();
      return String(item || '').trim();
    }).filter(Boolean).slice(0, 4);
  }

  const direct = [
    question.A, question.B, question.C, question.D,
    question.a, question.b, question.c, question.d,
    question.option_a, question.option_b, question.option_c, question.option_d,
    question.optionA, question.optionB, question.optionC, question.optionD,
    question.choice_a, question.choice_b, question.choice_c, question.choice_d,
    question.answer_a, question.answer_b, question.answer_c, question.answer_d,
    question.phuong_an_a, question.phuong_an_b, question.phuong_an_c, question.phuong_an_d,
  ].map(item => String(item || '').trim()).filter(Boolean);
  if (direct.length) return direct.slice(0, 4);

  if (typeof source === 'string') {
    return source
      .split(/\n|\||;/)
      .map(item => item.replace(/^[A-Da-d][.)\-:]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  return [];
}
function normalizeCorrectIndex(question, options) {
  const direct = Number(question.correctAnswerIndex != null ? question.correctAnswerIndex : (question.correct_answer_index != null ? question.correct_answer_index : question.correct_index));
  if (Number.isInteger(direct) && direct >= 0 && direct < options.length) return direct;
  const answerRaw = question.correct_answer != null ? question.correct_answer : (question.answer != null ? question.answer : (question.correctAnswer != null ? question.correctAnswer : ''));
  const answer = String(answerRaw).trim();
  const byText = options.findIndex(option => String(option).trim() === answer);
  return byText >= 0 ? byText : 0;
}

function getQuestionRows(quizJson, courseId, lessons) {
  const rawQuestions = quizJson.questions || quizJson.finalQuestions || quizJson.quiz || quizJson.items || [];
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) throw new Error('quiz_json phải có mảng questions');

  return rawQuestions.map((question, index) => {
    const options = normalizeQuestionOptions(question);
    if (options.length !== 4) throw new Error(`Câu hỏi ${index + 1} phải có đúng 4 lựa chọn`);
    const correctIndex = normalizeCorrectIndex(question, options);
    return {
      course_id: courseId,
      lesson_id: lessons[index % Math.max(lessons.length, 1)]?.id || null,
      question_text: String(question.question || question.question_text || question.title || '').trim(),
      question_type: 'single_choice',
      options,
      correct_answer: String(correctIndex),
      correct_answer_index: correctIndex,
      explanation: String(question.explanation || question.explain || options[correctIndex] || '').trim(),
      source: 'ai_final_test',
      sort_order: Number(question.sort_order || question.order || index + 1),
      difficulty: question.difficulty || 'final',
    };
  }).filter(row => row.question_text);
}

async function uploadJsonMaterial(file, courseId, kind, rawText) {
  const safeFileName = file.name.replace(/[^\w.-]+/g, '_');
  const filePath = `${courseId}/json/${Date.now()}_${kind}_${safeFileName}`;
  const { error: uploadError } = await supabase.storage
    .from(TRAINING_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: 'application/json' });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(TRAINING_BUCKET).getPublicUrl(filePath);
  const { data, error } = await supabase
    .from('training_materials')
    .insert({
      course_id: courseId,
      title: kind === 'lesson_json' ? 'lesson_json' : 'quiz_json',
      file_name: file.name,
      file_type: 'json',
      file_url: publicUrlData.publicUrl,
      storage_path: filePath,
      extracted_text: rawText,
      convert_status: 'imported_json',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createTrainingCourseFromJson({ lessonFile, quizFile, originalFile, createdBy }) {
  const lesson = await readJsonFile(lessonFile, 'lesson_json');
  const quiz = await readJsonFile(quizFile, 'quiz_json');

  const title = String(lesson.json.course_title || lesson.json.title || '').trim();
  if (!title) throw new Error('lesson_json phải có course_title');

  const course = await createTrainingCourse({
    title,
    description: String(lesson.json.course_description || lesson.json.description || '').trim(),
    duration_minutes: lesson.json.duration_minutes,
    created_by: createdBy,
  });

  const lessonMaterial = await uploadJsonMaterial(lessonFile, course.id, 'lesson_json', lesson.text);
  await uploadJsonMaterial(quizFile, course.id, 'quiz_json', quiz.text);

  if (originalFile) {
    await uploadTrainingMaterial(originalFile, course.id);
  }

  const lessonRows = getSectionRows(lesson.json, course.id, lessonMaterial.id);
  const { data: lessons, error: lessonError } = await supabase
    .from('training_lessons')
    .insert(lessonRows)
    .select();
  if (lessonError) throw lessonError;

  const questionRows = getQuestionRows(quiz.json, course.id, lessons || []);
  const { error: questionError } = await supabase.from('training_questions').insert(questionRows);
  if (questionError) throw questionError;

  return { ...course, lessons_count: lessonRows.length, questions_count: questionRows.length };
}
export async function updateTrainingCourse(courseId, patch) {
  const title = String(patch.title || '').trim();
  if (!title) throw new Error('Vui lòng nhập tên bài giảng');
  const { data, error } = await supabase
    .from('training_courses')
    .update({
      title,
      description: String(patch.description || '').trim(),
      status: patch.status || 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTrainingCourse(courseId) {
  const { error } = await supabase
    .from('training_courses')
    .delete()
    .eq('id', courseId);
  if (error) throw error;
}
export async function publishTrainingCourse(courseId, userId) {
  const { data, error } = await supabase
    .from('training_courses')
    .update({ status: 'published', published_at: new Date().toISOString(), published_by: userId || null })
    .eq('id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadTrainingMaterial(file, courseId) {
  if (!file) throw new Error('Chưa chọn file');
  if (!courseId) throw new Error('Thiếu courseId');

  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  const safeFileName = file.name.replace(/[^\w.-]+/g, '_');
  const filePath = `${courseId}/${Date.now()}_${safeFileName}`;
  const extractedText = await extractTextFromFile(file);

  const { error: uploadError } = await supabase.storage
    .from(TRAINING_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(TRAINING_BUCKET).getPublicUrl(filePath);

  try {
    const { data, error } = await supabase
      .from('training_materials')
      .insert({
        course_id: courseId,
        title: file.name.replace(new RegExp(`\\.${fileExt}$`, 'i'), ''),
        file_name: file.name,
        file_type: fileExt,
        file_url: publicUrlData.publicUrl,
        storage_path: filePath,
        extracted_text: extractedText,
        convert_status: extractedText && extractedText.trim() ? 'uploaded' : 'uploaded_no_text',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    await supabase.storage.from(TRAINING_BUCKET).remove([filePath]).catch(console.error);
    throw error;
  }
}

export async function getMaterialsByCourse(courseId) {
  if (!courseId) return [];
  const { data, error } = await supabase
    .from('training_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function convertMaterialToELearning(materialId) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/convert-training-material`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ material_id: materialId }),
  });

  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = { error: bodyText };
  }

  if (!response.ok) {
    throw new Error(body?.error || body?.message || `Edge Function HTTP ${response.status}`);
  }
  return body;
}

export async function getLessonsByCourse(courseId) {
  if (!courseId) return [];
  const { data, error } = await supabase
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('lesson_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getQuestionsByLesson(lessonId) {
  if (!lessonId) return [];
  const { data, error } = await supabase
    .from('training_questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .neq('source', 'ai_final_test')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getFinalTestQuestions(courseId) {
  if (!courseId) return [];
  const { data, error } = await supabase
    .from('training_questions')
    .select('*')
    .eq('course_id', courseId)
    .eq('source', 'ai_final_test')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAssignmentsForUser(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('training_assignments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLearningProgress(courseId, userId) {
  if (!courseId || !userId) return [];
  const { data, error } = await supabase
    .from('training_learning_progress')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function markLessonComplete({ courseId, lessonId, userId, quickAnswer, quickCorrect }) {
  if (!courseId || !lessonId || !userId) return null;

  const existing = await supabase
    .from('training_learning_progress')
    .select('id, started_at')
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const now = new Date().toISOString();
  const record = {
    course_id: courseId,
    lesson_id: lessonId,
    user_id: userId,
    started_at: existing.data?.started_at || now,
    is_completed: true,
    status: 'completed',
    completed_at: now,
    quick_answer: quickAnswer ?? null,
    quick_correct: typeof quickCorrect === 'boolean' ? quickCorrect : null,
    updated_at: now,
  };

  const query = existing.data
    ? supabase.from('training_learning_progress').update(record).eq('id', existing.data.id).select().single()
    : supabase.from('training_learning_progress').insert(record).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function startTestAttempt({ courseId, userId }) {
  if (!courseId || !userId) return null;
  const { data, error } = await supabase
    .from('training_test_attempts')
    .insert({
      course_id: courseId,
      user_id: userId,
      started_at: new Date().toISOString(),
      status: 'in_progress',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitFinalTest({ attemptId, courseId, userId, questions, answers, passingScore = 80, startedAt }) {
  const actualStartedAt = startedAt ? new Date(startedAt) : new Date(Date.now() - 1000);
  const submittedAt = new Date();
  const durationSeconds = Math.max(1, Math.round((submittedAt.getTime() - actualStartedAt.getTime()) / 1000));
  
  const correctCount = questions.reduce((sum, question) => {
    const expected = Number(question.correct_answer_index != null ? question.correct_answer_index : (question.correct_answer != null ? question.correct_answer : -1));
    return sum + (Number(answers[question.id]) === expected ? 1 : 0);
  }, 0);
  const totalQuestions = questions.length;
  const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 10000) / 100 : 0;
  const passed = score >= Number(passingScore || 80);

  const record = {
    course_id: courseId,
    user_id: userId,
    started_at: actualStartedAt.toISOString(),
    submitted_at: submittedAt.toISOString(),
    score,
    correct_count: correctCount,
    total_questions: totalQuestions,
    passed,
    passing_score: passingScore,
    duration_seconds: durationSeconds,
    status: 'submitted',
  };

  let attempt, attemptError;
  if (attemptId) {
    const res = await supabase.from('training_test_attempts').update(record).eq('id', attemptId).select().single();
    attempt = res.data;
    attemptError = res.error;
  } else {
    const res = await supabase.from('training_test_attempts').insert(record).select().single();
    attempt = res.data;
    attemptError = res.error;
  }
  
  if (attemptError) throw attemptError;

  const answerRows = questions.map((question) => {
    const expected = Number(question.correct_answer_index != null ? question.correct_answer_index : (question.correct_answer != null ? question.correct_answer : -1));
    const selected = Number(answers[question.id]);
    return {
      attempt_id: attempt.id,
      question_id: question.id,
      selected_answer: Number.isFinite(selected) ? String(selected) : null,
      is_correct: selected === expected,
    };
  });

  if (answerRows.length) {
    const { error: answersError } = await supabase.from('training_test_answers').insert(answerRows);
    if (answersError) throw answersError;
  }

  return { ...attempt, score, correct_count: correctCount, total_questions: totalQuestions, passed };
}

export async function getLearnerCourseStats(courseIds, userId) {
  if (!courseIds || courseIds.length === 0 || !userId) return {};
  try {
    const [{ data: lessons }, { data: progress }, { data: attempts }] = await Promise.all([
      supabase.from('training_lessons').select('course_id').in('course_id', courseIds),
      supabase.from('training_learning_progress').select('course_id, lesson_id').eq('user_id', userId).eq('is_completed', true).in('course_id', courseIds),
      supabase.from('training_test_attempts').select('course_id, passed').eq('user_id', userId).in('course_id', courseIds)
    ]);
    const stats = {};
    courseIds.forEach(id => {
      stats[id] = { total: 0, completed: 0, completion: 0, passed: null };
    });
    (lessons || []).forEach(l => { if (stats[l.course_id]) stats[l.course_id].total++; });
    const uniqueProgress = new Set((progress || []).map(p => p.course_id + '_' + p.lesson_id));
    uniqueProgress.forEach(key => {
      const cid = key.split('_')[0];
      if (stats[cid]) stats[cid].completed++;
    });
    courseIds.forEach(id => {
      if (stats[id].total > 0) {
        stats[id].completion = Math.round((stats[id].completed / stats[id].total) * 100);
      }
    });
    (attempts || []).forEach(a => {
      if (stats[a.course_id]) {
        // if any attempt is passed, mark as passed. otherwise false.
        if (stats[a.course_id].passed !== true) {
          stats[a.course_id].passed = a.passed ? true : false;
        }
      }
    });
    return stats;
  } catch (err) {
    console.error('Error fetching course stats:', err);
    return {};
  }
}

export async function startLesson({ courseId, lessonId, userId }) {
  if (!courseId || !lessonId || !userId) return null;
  const existing = await supabase
    .from('training_learning_progress')
    .select('id')
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const { data, error } = await supabase.from('training_learning_progress').insert({
    course_id: courseId,
    lesson_id: lessonId,
    user_id: userId,
    started_at: new Date().toISOString(),
    is_completed: false,
    status: 'in_progress',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getContinuousTrainingHistory(userId, isAdmin) {
  let query = supabase
    .from('training_test_attempts')
    .select(`
      id, course_id, user_id, started_at, submitted_at, total_questions, correct_count, score, passed, duration_seconds, status,
      training_courses(title)
    `)
    .order('submitted_at', { ascending: false, nullsFirst: false });

  if (!isAdmin && userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  // Fetch users manually since there is no explicit foreign key
  const userIds = [...new Set(data.map(d => d.user_id).filter(Boolean))];
  let usersMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, full_name').in('id', userIds);
    if (users) {
      users.forEach(u => { usersMap[u.id] = u; });
    }
  }

  return data.map(d => ({
    ...d,
    users: usersMap[d.user_id] || null
  }));
}

export async function getContinuousTrainingLessonsProgress(userId, isAdmin) {
  let query = supabase
    .from('training_learning_progress')
    .select(`
      id, course_id, lesson_id, user_id, started_at, completed_at, total_seconds, is_completed, status,
      training_courses(title),
      training_lessons(title)
    `)
    .order('started_at', { ascending: false });

  if (!isAdmin && userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  // Calculate actual duration if still in progress, up to an hour max for display
  const result = data.map(item => {
    let calc = item.total_seconds || 0;
    if (!item.is_completed && item.started_at) {
      const diff = Math.round((new Date().getTime() - new Date(item.started_at).getTime()) / 1000);
      calc += Math.max(0, Math.min(diff, 3600)); // cap in-progress session to 1 hour
    }
    return { ...item, calculated_seconds: calc };
  });

  // Fetch users manually
  const userIds = [...new Set(result.map(d => d.user_id).filter(Boolean))];
  let usersMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, full_name').in('id', userIds);
    if (users) {
      users.forEach(u => { usersMap[u.id] = u; });
    }
  }

  return result.map(d => ({
    ...d,
    users: usersMap[d.user_id] || null
  }));
}

export async function getTestAttemptDetails(attemptId) {
  if (!attemptId) return [];
  const { data: answers, error } = await supabase
    .from('training_test_answers')
    .select(`
      id, selected_answer, is_correct,
      training_questions (
        id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation
      )
    `)
    .eq('attempt_id', attemptId);
  if (error) throw error;

  return (answers || []).map(a => {
    const q = a.training_questions;
    if (!q) return null;
    const options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);
    const expectedText = String(q.correct_answer || '').trim();
    let expectedIndex = options.findIndex(opt => String(opt).trim() === expectedText);
    if (expectedIndex < 0 && expectedText.length === 1 && expectedText >= 'A' && expectedText <= 'D') {
      expectedIndex = expectedText.charCodeAt(0) - 65;
    } else if (expectedIndex < 0) {
      expectedIndex = 0;
    }
    return {
      dung: a.is_correct,
      cau_hoi: q.question_text,
      lua_chon: options,
      dap_an_da_chon: a.selected_answer !== null ? Number(a.selected_answer) : -1,
      dap_an_dung: expectedIndex,
      giai_thich: q.explanation || ''
    };
  }).filter(Boolean);
}

export async function deleteLessonProgress(progressId) {
  const { error } = await supabase.from('training_lesson_progress').delete().eq('id', progressId);
  if (error) throw error;
  return true;
}

export async function deleteTestAttempt(attemptId) {
  const { error } = await supabase.from('training_test_attempts').delete().eq('id', attemptId);
  if (error) throw error;
  return true;
}
