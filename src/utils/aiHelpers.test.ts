import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SCHOOL_DATABASE } from '../data/mockData.ts';
import {
  buildSchoolSnapshot,
  buildGeminiSystemInstruction,
  needsSchoolSnapshot,
  formatGeminiErrorMessage,
  parseSseLines,
  parseDataUrlToImagePart,
} from './aiHelpers.ts';

test('buildSchoolSnapshot includes student, attendance, finance, teacher waitlist, and bus telemetry', () => {
  const snapshot = buildSchoolSnapshot(INITIAL_SCHOOL_DATABASE);
  assert.match(snapshot, /STAR AI Academy/);
  assert.match(snapshot, /Students:/);
  assert.match(snapshot, /Attendance Today:/);
  assert.match(snapshot, /Finance:/);
  assert.match(snapshot, /Teachers Waiting for Job:/);
  assert.match(snapshot, /Dr\. Maya Krishnan|Maya Krishnan/);
  assert.match(snapshot, /Transport Fleet:/);
});

test('needsSchoolSnapshot includes snapshot for school prompts and skips for general prompts', () => {
  assert.equal(needsSchoolSnapshot('Who is absent today?', 'universal_qa'), true);
  assert.equal(needsSchoolSnapshot('Give me the teachers waiting list', 'universal_qa'), true);
  assert.equal(needsSchoolSnapshot('Solve 2x + 5 = 19', 'universal_qa'), false);
  assert.equal(needsSchoolSnapshot('Write a Python quicksort function', 'universal_qa'), false);
  assert.equal(needsSchoolSnapshot('Summarize priorities', 'principal_summary'), true);
});

test('buildGeminiSystemInstruction instructs Gemini to answer all questions fast and concisely', () => {
  const universal = buildGeminiSystemInstruction('universal_qa', 'student');
  assert.match(universal, /Answer ANY question directly/i);
  assert.match(universal, /Active role: student/i);

  const teacher = buildGeminiSystemInstruction('teacher_lesson_plan', 'teacher');
  assert.match(teacher, /AI Teacher Assistant/);
});

test('parseSseLines parses multi-chunk SSE frames and preserves incomplete remainder', () => {
  const chunk1 = 'data: {"text":"Hello "}\n\ndata: {"text":"world"}\n\ndata: {"tex';
  const parsed1 = parseSseLines(chunk1);
  assert.equal(parsed1.events.length, 2);
  assert.equal(parsed1.events[0].text, 'Hello ');
  assert.equal(parsed1.events[1].text, 'world');
  assert.equal(parsed1.remaining, 'data: {"tex');

  const chunk2 = parsed1.remaining + 't":"!"}\n\ndata: {"done":true,"latencyMs":320}\n\n';
  const parsed2 = parseSseLines(chunk2);
  assert.equal(parsed2.events.length, 2);
  assert.equal(parsed2.events[0].text, '!');
  assert.equal(parsed2.events[1].done, true);
  assert.equal(parsed2.events[1].latencyMs, 320);
  assert.equal(parsed2.remaining, '');
});

test('formatGeminiErrorMessage classifies API key, quota, and model errors cleanly', () => {
  const authErr = formatGeminiErrorMessage(new Error('403 PERMISSION_DENIED: API_KEY_INVALID'));
  assert.equal(authErr.status, 403);
  assert.match(authErr.message, /Settings > Secrets/);

  const quotaErr = formatGeminiErrorMessage(new Error('429 RESOURCE_EXHAUSTED'));
  assert.equal(quotaErr.status, 429);
  assert.match(quotaErr.message, /rate limit|quota/i);

  const notFoundErr = formatGeminiErrorMessage(new Error('404 NOT_FOUND'));
  assert.equal(notFoundErr.status, 404);
});

test('parseDataUrlToImagePart extracts valid base64 image parts and rejects non-images', () => {
  const valid = parseDataUrlToImagePart('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==', 'diagram.png');
  assert.ok(valid);
  assert.equal(valid.mimeType, 'image/png');
  assert.equal(valid.data, 'iVBORw0KGgoAAAANSUhEUg==');
  assert.equal(valid.name, 'diagram.png');

  assert.equal(parseDataUrlToImagePart('data:text/plain;base64,SGVsbG8='), null);
  assert.equal(parseDataUrlToImagePart('not-a-data-url'), null);
});

test('buildGeminiSystemInstruction includes multimodal image analysis guidance', () => {
  const instruction = buildGeminiSystemInstruction('universal_qa', 'principal');
  assert.match(instruction, /image or photo is provided/i);
});
