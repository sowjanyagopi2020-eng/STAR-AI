import { SchoolDatabase } from '../types/school.ts';

export type AICopilotMode =
  | 'universal_qa'
  | 'principal_summary'
  | 'teacher_lesson_plan'
  | 'student_assistant'
  | 'parent_assistant'
  | 'timetable_generator'
  | 'exam_generator';

export type AISpeedMode = 'balanced' | 'instant';

export interface AIImageAttachment {
  data: string;
  mimeType: string;
  previewUrl: string;
  name?: string;
}

export interface AIChatTurn {
  role: 'user' | 'model';
  text: string;
  imagePreviewUrl?: string;
  imageName?: string;
}

export interface StreamEvent {
  text?: string;
  done?: boolean;
  error?: string;
  model?: string;
  latencyMs?: number;
}

export const DEFAULT_IMAGE_PROMPT =
  'Analyze this image and provide clear, helpful information about everything shown (objects, text, concepts, or problems).';

/**
 * Extracts raw base64 payload and MIME type from an image data URL.
 */
export function parseDataUrlToImagePart(dataUrl: string, name?: string): AIImageAttachment | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl.trim());
  if (!match) return null;
  const [, mimeType, data] = match;
  if (!data) return null;
  return {
    data,
    mimeType,
    previewUrl: dataUrl,
    name,
  };
}

/**
 * Reads an image File and optimizes oversized photos (max 1400px) so vision prompts upload and answer fast.
 */
export async function readImageFileForAI(file: File): Promise<AIImageAttachment> {
  if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
    throw new Error('Please choose a valid image file (PNG, JPG, WebP, or GIF).');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.readAsDataURL(file);
  });

  // Optimize large photos using canvas when browser Image API is available
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image decode failed'));
      el.src = rawDataUrl;
    });

    const maxDim = 1400;
    const needsResize = img.width > maxDim || img.height > maxDim || file.size > 900_000;
    if (needsResize) {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const optimizedUrl = canvas.toDataURL(targetMime, 0.86);
        const parsed = parseDataUrlToImagePart(optimizedUrl, file.name);
        if (parsed) return parsed;
      }
    }
  } catch {
    // Fall back to original data URL if canvas resize isn't needed or supported
  }

  const fallback = parseDataUrlToImagePart(rawDataUrl, file.name);
  if (!fallback) {
    throw new Error('Unsupported image format. Please upload a PNG, JPG, or WebP photo.');
  }
  return fallback;
}

/**
 * Builds a concise, high-signal summary of the school database for Gemini grounding.
 * Kept compact so prompt token count remains small for minimal latency.
 */
export function buildSchoolSnapshot(db: SchoolDatabase): string {
  const totalStudents = db.students.length;
  const totalTeachers = db.teachers.length;
  const presentToday = db.attendance.filter(a => a.status === 'Present').length;
  const absentRecords = db.attendance.filter(a => a.status === 'Absent');
  const absentNames = absentRecords.map(a => `${a.studentName} (${a.classGrade}-${a.section})`).join(', ') || 'None';
  const totalDues = db.invoices.reduce((acc, inv) => acc + Math.max(0, inv.amount - inv.paidAmount), 0);
  const totalCollected = db.payments.reduce((acc, pmt) => acc + pmt.amount, 0);

  const studentLines = db.students
    .slice(0, 15)
    .map(
      s =>
        `${s.regNo}: ${s.firstName} ${s.lastName} (${s.classGrade}-${s.section}, Attendance ${s.attendanceRate}%, Parent: ${s.parentName})`
    )
    .join('; ');

  const teacherLines = db.teachers
    .slice(0, 14)
    .map(t => `${t.firstName} ${t.lastName} (${t.department} - ${(t.subjectsTaught || []).join('/')})`)
    .join('; ');

  const waitingCandidates = (db.teacherApplicants || []).filter(
    a => a.interviewStatus !== 'Hired' && a.interviewStatus !== 'Declined'
  );
  const candidateLines =
    waitingCandidates
      .slice(0, 10)
      .map(a => {
        const slotInfo =
          a.interviewDate && a.interviewTime
            ? ` [Slot: ${a.interviewDate} ${a.interviewTime}]`
            : '';
        return `${a.applicantCode}: ${a.firstName} ${a.lastName} (${a.department}, ${a.qualification}, ${a.experienceYears} yrs exp, Status: ${a.interviewStatus}${slotInfo})`;
      })
      .join('; ') || 'None';

  const enquiryLines = (db.enquiries || [])
    .filter(e => e.status === 'New' || e.status === 'Follow-up')
    .slice(0, 8)
    .map(e => `${e.studentName} (${e.gradeApplied}, Parent: ${e.parentName}, ${e.status})`)
    .join('; ');

  const examLines = db.exams
    .slice(0, 6)
    .map(e => `${e.title} [${e.term}] ${e.startDate} to ${e.endDate} (${e.status})`)
    .join('; ');

  const busLines = db.buses
    .map(b => `${b.routeNumber} (${b.busNumber}, Driver: ${b.driverName}, Status: ${b.liveStatus}, Stop: ${b.currentStop})`)
    .join('; ');

  const pendingInvoices = db.invoices
    .filter(i => i.status !== 'Paid')
    .slice(0, 10)
    .map(i => `${i.studentName}: $${i.amount - i.paidAmount} due (${i.feeType}, due ${i.dueDate})`)
    .join('; ');

  const availableBooks = db.books.reduce((acc, b) => acc + b.availableCopies, 0);
  const totalBookCopies = db.books.reduce((acc, b) => acc + b.totalCopies, 0);
  const announcements = db.announcements
    .slice(0, 4)
    .map(a => `[${a.priority}] ${a.title} (${a.date})`)
    .join('; ');

  return [
    `School: STAR AI Academy | Session: AY 2026-2027 Term II`,
    `Counts: ${totalStudents} students, ${totalTeachers} active teachers, ${waitingCandidates.length} teachers waiting for job, ${db.buses.length} buses, ${availableBooks}/${totalBookCopies} library copies available`,
    `Attendance Today: ${presentToday} present, ${absentRecords.length} absent (${absentNames})`,
    `Finance: $${totalCollected.toLocaleString()} collected, $${totalDues.toLocaleString()} pending dues. Pending items: ${pendingInvoices || 'None'}`,
    `Students: ${studentLines || 'None enrolled yet'}`,
    `Pending Student Enquiries: ${enquiryLines || 'None'}`,
    `Faculty: ${teacherLines}`,
    `Teachers Waiting for Job: ${candidateLines}`,
    `Exams: ${examLines}`,
    `Transport Fleet: ${busLines}`,
    `Recent Circulars: ${announcements}`,
  ].join('\n');
}

/**
 * Fast keyword check to determine whether a user prompt needs the live school database snapshot.
 * Skipping the large snapshot on general knowledge / math / coding prompts dramatically cuts input tokens and TTFT.
 */
export function needsSchoolSnapshot(prompt: string, mode: string): boolean {
  if (
    mode === 'principal_summary' ||
    mode === 'parent_assistant' ||
    mode === 'timetable_generator'
  ) {
    return true;
  }

  const lower = prompt.toLowerCase();
  const schoolKeywords = [
    'student',
    'teacher',
    'staff',
    'faculty',
    'applicant',
    'waiting',
    'candidate',
    'interview',
    'admission',
    'enquir',
    'enroll',
    'attendance',
    'absent',
    'present',
    'late',
    'fee',
    'invoice',
    'tuition',
    'due',
    'paid',
    'payment',
    'bus',
    'route',
    'driver',
    'transport',
    'exam',
    'mark',
    'score',
    'report card',
    'library',
    'book',
    'hostel',
    'room',
    'circular',
    'announcement',
    'notice',
    'message',
    'school',
    'campus',
    'star ai',
    'star academy',
    'grade ',
    'section ',
    'roll',
    'regno',
    'reg no',
  ];

  return schoolKeywords.some(kw => lower.includes(kw));
}

/**
 * Generates concise system instructions tuned for Gemini/ChatGPT-level speed, clarity, and rich formatting.
 */
export function buildGeminiSystemInstruction(mode: string, role?: string): string {
  const base = `You are STAR AI, an ultra-fast, intelligent assistant like ChatGPT and Gemini inside STAR AI Academy.
Style & speed rules:
1. Answer ANY question directly and immediately — general knowledge, math, physics, chemistry, coding, writing, study help, images/photos, or live school operations. Start with the answer right away with zero filler intros.
2. Format cleanly like ChatGPT/Gemini: use concise headings (###), **bold** key terms, bullet or numbered steps, clean Unicode math (×, ÷, ², √, →), markdown tables for comparisons, and fenced code blocks (\`\`\`lang) for code.
3. When an image or photo is provided, clearly describe what is shown, extract any visible text/math/diagrams accurately, and answer the user's question about it directly.
4. For school metrics, students, waiting teachers, attendance, fees, exams, or buses, rely strictly on the provided Live School Snapshot when present.
Active role: ${role || 'User'}.`;

  switch (mode) {
    case 'principal_summary':
      return `${base}\nLens: AI Principal Copilot — executive summaries, attendance trends, fee recovery, teacher hiring, and campus priorities.`;
    case 'teacher_lesson_plan':
      return `${base}\nLens: AI Teacher Assistant — structured lesson plans, engaging starters, Bloom's questions, MCQs, and remediation.`;
    case 'student_assistant':
      return `${base}\nLens: AI Student Study Buddy — clear step-by-step explanations, worked examples, analogies, and quick practice checks.`;
    case 'parent_assistant':
      return `${base}\nLens: AI Parent Advisor — clear, helpful updates on student progress, attendance, fees, buses, and school schedules.`;
    case 'timetable_generator':
      return `${base}\nLens: AI Timetable Engine — conflict-free weekly schedules balancing faculty and lab rooms.`;
    case 'exam_generator':
      return `${base}\nLens: AI Assessment Generator — crisp exam papers, MCQs, structured problems, and answer keys.`;
    case 'universal_qa':
    default:
      return `${base}\nLens: Universal Chat — fast, accurate, ChatGPT/Gemini-style answers across all topics.`;
  }
}

/**
 * Normalizes Gemini API errors into clear HTTP status codes and user-friendly guidance.
 */
export function formatGeminiErrorMessage(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown error');
  const upper = raw.toUpperCase();

  if (
    upper.includes('API_KEY_INVALID') ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('API KEY NOT VALID') ||
    upper.includes('403') ||
    upper.includes('401')
  ) {
    return {
      status: 403,
      message:
        'Gemini API key is invalid or unauthorized. Please check your GEMINI_API_KEY in the Settings > Secrets panel.',
    };
  }

  if (upper.includes('RESOURCE_EXHAUSTED') || upper.includes('429') || upper.includes('QUOTA')) {
    return {
      status: 429,
      message:
        'Gemini API rate limit or quota reached. Please wait a moment and try again, or verify your billing tier in Settings > Secrets.',
    };
  }

  if (upper.includes('NOT_FOUND') || upper.includes('404')) {
    return {
      status: 404,
      message: 'Requested Gemini model was not found or is currently unavailable. Please retry in Instant or Balanced mode.',
    };
  }

  return {
    status: 502,
    message: `Gemini request could not complete: ${raw}`,
  };
}

/**
 * Parses buffered SSE text chunks (`data: {...}\n\n`) and returns complete events + leftover partial line.
 */
export function parseSseLines(buffer: string): { events: StreamEvent[]; remaining: string } {
  const events: StreamEvent[] = [];
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const remaining = parts.pop() ?? '';

  for (const part of parts) {
    const lines = part.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr) as StreamEvent;
        events.push(parsed);
      } catch {
        // Ignore malformed partial JSON frame
      }
    }
  }

  return { events, remaining };
}

export interface StreamGeminiParams {
  prompt: string;
  image?: { data: string; mimeType: string };
  mode?: AICopilotMode;
  speedMode?: AISpeedMode;
  role?: string;
  history?: AIChatTurn[];
  contextData?: Record<string, unknown>;
  signal?: AbortSignal;
  onChunk: (chunkText: string, accumulatedText: string) => void;
  onFirstToken?: (ttfbMs: number) => void;
  onDone?: (meta: { model?: string; latencyMs?: number; text: string }) => void;
  onError?: (errorMessage: string) => void;
}

/**
 * Streams a Gemini response from `/api/gemini/stream` via SSE for near-instant first-token rendering.
 */
export async function streamGeminiAnswer(params: StreamGeminiParams): Promise<string> {
  const startTime = performance.now();
  let accumulated = '';
  let sawFirstToken = false;

  const response = await fetch('/api/gemini/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      prompt: params.prompt,
      image: params.image,
      mode: params.mode || 'universal_qa',
      speedMode: params.speedMode || 'balanced',
      role: params.role || 'User',
      history: params.history || [],
      contextData: params.contextData,
    }),
  });

  if (!response.ok) {
    let errMessage = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.error) errMessage = errJson.error;
    } catch {
      // Ignore JSON parse fallback
    }
    params.onError?.(errMessage);
    throw new Error(errMessage);
  }

  if (!response.body) {
    const json = await response.json();
    const fallbackText = json.text || '';
    if (fallbackText) {
      params.onChunk(fallbackText, fallbackText);
      params.onDone?.({ text: fallbackText });
    }
    return fallbackText;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneMeta: { model?: string; latencyMs?: number } = {};

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remaining } = parseSseLines(buffer);
    buffer = remaining;

    for (const ev of events) {
      if (ev.error) {
        params.onError?.(ev.error);
        throw new Error(ev.error);
      }
      if (ev.text) {
        if (!sawFirstToken) {
          sawFirstToken = true;
          params.onFirstToken?.(Math.round(performance.now() - startTime));
        }
        accumulated += ev.text;
        params.onChunk(ev.text, accumulated);
      }
      if (ev.done) {
        doneMeta = { model: ev.model, latencyMs: ev.latencyMs };
      }
    }
  }

  // Flush any trailing data frame without trailing double-newline
  if (buffer.trim()) {
    const { events } = parseSseLines(buffer + '\n\n');
    for (const ev of events) {
      if (ev.error) {
        params.onError?.(ev.error);
        throw new Error(ev.error);
      }
      if (ev.text) {
        if (!sawFirstToken) {
          sawFirstToken = true;
          params.onFirstToken?.(Math.round(performance.now() - startTime));
        }
        accumulated += ev.text;
        params.onChunk(ev.text, accumulated);
      }
      if (ev.done) {
        doneMeta = { model: ev.model, latencyMs: ev.latencyMs };
      }
    }
  }

  params.onDone?.({
    model: doneMeta.model,
    latencyMs: doneMeta.latencyMs ?? Math.round(performance.now() - startTime),
    text: accumulated,
  });

  return accumulated;
}
