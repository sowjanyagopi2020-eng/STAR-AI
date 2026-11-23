import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  BrainCircuit,
  GraduationCap,
  FileSpreadsheet,
  ArrowUp,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Clock,
  Printer,
  Zap,
  Square,
  RotateCcw,
  Globe,
  AlertCircle,
  Plus,
  ImagePlus,
  X,
} from 'lucide-react';
import { SchoolDatabase, UserAccount } from '../../types/school.ts';
import { FormattedAIText } from '../common/FormattedAIText.tsx';
import {
  AICopilotMode,
  AISpeedMode,
  AIChatTurn,
  AIImageAttachment,
  DEFAULT_IMAGE_PROMPT,
  readImageFileForAI,
  streamGeminiAnswer,
} from '../../utils/aiHelpers.ts';

interface AIIntelligenceCenterViewProps {
  db: SchoolDatabase;
  currentUser: UserAccount;
}

interface MessageItem extends AIChatTurn {
  id: string;
  isError?: boolean;
  imageAttachment?: { data: string; mimeType: string };
}

export const AIIntelligenceCenterView: React.FC<AIIntelligenceCenterViewProps> = ({
  db,
  currentUser,
}) => {
  const [selectedMode, setSelectedMode] = useState<AICopilotMode>('universal_qa');
  const [speedMode, setSpeedMode] = useState<AISpeedMode>('instant');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<AIImageAttachment | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [prompt]);

  const modeItems: { id: AICopilotMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'universal_qa', label: 'Ask Anything', icon: Globe },
    { id: 'principal_summary', label: 'Principal Copilot', icon: BrainCircuit },
    { id: 'teacher_lesson_plan', label: 'Teacher Assistant', icon: BookOpen },
    { id: 'student_assistant', label: 'Study Buddy', icon: GraduationCap },
    { id: 'parent_assistant', label: 'Parent Advisor', icon: HelpCircle },
    { id: 'timetable_generator', label: 'Timetable', icon: Clock },
    { id: 'exam_generator', label: 'Assessment', icon: FileSpreadsheet },
  ];

  const presetPrompts: Record<AICopilotMode, { title: string; prompt: string }[]> = {
    universal_qa: [
      {
        title: 'Live Attendance & Fees',
        prompt: 'Who is absent today and what is our current total pending fee balance?',
      },
      {
        title: 'Step-by-Step Math',
        prompt: 'Solve 2x² - 7x + 3 = 0 step by step',
      },
      {
        title: 'Science Explained',
        prompt: 'Explain quantum entanglement in simple terms with an everyday example',
      },
      {
        title: 'Principal Speech',
        prompt: 'Write a short, inspiring Principal speech for our Annual STEM Day',
      },
    ],
    principal_summary: [
      {
        title: 'Daily Operations Briefing',
        prompt: "Generate today's executive school operations briefing and attendance highlight",
      },
      {
        title: 'Fee Collection Analysis',
        prompt: 'Analyze fee collection progress and propose follow-up strategies for pending dues',
      },
      {
        title: 'Teacher Hiring Pipeline',
        prompt: 'Summarize our waiting teacher applicants and suggest priority interview candidates',
      },
      {
        title: 'Weekly Admin Priorities',
        prompt: 'Identify critical administrative tasks and pending academic approvals for this week',
      },
    ],
    teacher_lesson_plan: [
      {
        title: '45-Min Lesson Plan',
        prompt: 'Create a 45-minute lesson plan on Quadratic Equations for Grade 10 with starter, activities, and quiz',
      },
      {
        title: 'Physics MCQ Quiz',
        prompt: "Generate a 5-question multiple choice diagnostic assessment for Snell's Law in Physics",
      },
      {
        title: 'Differentiated Support',
        prompt: 'Suggest a differentiated improvement plan for students scoring below 60% in Mathematics',
      },
      {
        title: 'Lab Rubric',
        prompt: 'Create a clear grading rubric for a Grade 10 Chemistry titration lab report',
      },
    ],
    student_assistant: [
      {
        title: "Newton's Third Law",
        prompt: "Explain Newton's Third Law of Motion with 3 real-world sports analogies",
      },
      {
        title: 'Python Practice Quiz',
        prompt: 'Generate a 5-question practice quiz on Python data structures with answer explanations',
      },
      {
        title: '2-Week Revision Plan',
        prompt: 'Design a 2-week structured study revision schedule for Term II Midterms',
      },
      {
        title: 'Essay Outline',
        prompt: 'Help me outline a persuasive essay on renewable energy for school science fair',
      },
    ],
    parent_assistant: [
      {
        title: 'GPA & Assessments',
        prompt: 'Explain how Grade 10 academic assessments and GPA calculations are evaluated',
      },
      {
        title: 'Attendance & Leave',
        prompt: 'What are the mandatory school attendance policies and medical leave procedures?',
      },
      {
        title: 'Active Bus Routes',
        prompt: 'Which bus routes are active right now and who drives Route 04?',
      },
      {
        title: 'Parent-Teacher Prep',
        prompt: 'Give me 5 great questions to ask at a parent-teacher conference',
      },
    ],
    timetable_generator: [
      {
        title: 'Grade 10-A Weekly Grid',
        prompt: 'Generate a balanced weekly schedule for Grade 10-A ensuring no faculty conflicts',
      },
      {
        title: 'STEM Lab Rotations',
        prompt: 'Propose an optimized lab rotation schedule for Physics and Computer Science STEM hubs',
      },
      {
        title: 'Exam Week Schedule',
        prompt: 'Draft a 5-day midterm exam timetable with study gaps for Grades 9 to 12',
      },
      {
        title: 'Substitute Coverage',
        prompt: 'Suggest how to reorganize morning periods when two math teachers are away',
      },
    ],
    exam_generator: [
      {
        title: '25-Mark Math Midterm',
        prompt: 'Generate a 25-mark midterm test paper for Grade 10 Mathematics with 5 MCQs and 3 problem sums with answer key',
      },
      {
        title: 'Thermodynamics Paper',
        prompt: 'Generate a Grade 11 Physics paper on Thermodynamics with marking scheme and rubric',
      },
      {
        title: 'Biology Quick Test',
        prompt: 'Create a 15-minute quiz on Cell Division (Mitosis vs Meiosis) with answers',
      },
      {
        title: 'English Comprehension',
        prompt: 'Write a short reading passage and 5 analytical questions for Grade 9 English',
      },
    ],
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamingText.trim()) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          text: streamingText,
        },
      ]);
      setStreamingText('');
    }
    setIsLoading(false);
  };

  const handleFileSelected = async (file?: File | null) => {
    if (!file) return;
    setImageError(null);
    try {
      const processed = await readImageFileForAI(file);
      setAttachedImage(processed);
      setTimeout(() => textareaRef.current?.focus(), 40);
    } catch (err: any) {
      setImageError(err?.message || 'Could not load image.');
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgItem = items.find(item => item.type.startsWith('image/'));
    if (imgItem) {
      const file = imgItem.getAsFile();
      if (file) {
        e.preventDefault();
        await handleFileSelected(file);
      }
    }
  };

  const runPrompt = async (
    finalPrompt: string,
    baseMessages: MessageItem[],
    imageForTurn?: AIImageAttachment | null
  ) => {
    const cleanPrompt = finalPrompt.trim() || (imageForTurn ? DEFAULT_IMAGE_PROMPT : '');
    const userDisplayText = finalPrompt.trim() || 'Analyze this image';

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userDisplayText,
      imagePreviewUrl: imageForTurn?.previewUrl,
      imageName: imageForTurn?.name,
      imageAttachment: imageForTurn
        ? { data: imageForTurn.data, mimeType: imageForTurn.mimeType }
        : undefined,
    };

    const historyForApi: AIChatTurn[] = baseMessages
      .filter(m => !m.isError)
      .map(m => ({ role: m.role, text: m.text }));

    setMessages([...baseMessages, userMsg]);
    setIsLoading(true);
    setStreamingText('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fullText = await streamGeminiAnswer({
        prompt: cleanPrompt,
        image: imageForTurn ? { data: imageForTurn.data, mimeType: imageForTurn.mimeType } : undefined,
        mode: selectedMode,
        speedMode,
        role: currentUser.role,
        history: historyForApi,
        contextData: {
          currentUser: currentUser.name,
          totalStudents: db.students.length,
          totalTeachers: db.teachers.length,
        },
        signal: controller.signal,
        onChunk: (_chunk, accumulated) => {
          setStreamingText(accumulated);
        },
      });

      setStreamingText('');
      setMessages(prev => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: fullText || 'No response generated.',
        },
      ]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setStreamingText('');
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: err?.message || 'Unable to connect to STAR AI right now.',
          isError: true,
        },
      ]);
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  const handleGenerate = async (customPrompt?: string) => {
    const typedPrompt = (customPrompt ?? prompt).trim();
    const activeImage = customPrompt ? null : attachedImage;
    if ((!typedPrompt && !activeImage) || isLoading) return;
    if (!customPrompt) {
      setPrompt('');
      setAttachedImage(null);
      setImageError(null);
    }
    await runPrompt(typedPrompt, messages, activeImage);
  };

  const handleRegenerate = async (modelIndex: number) => {
    if (isLoading) return;
    // Find the preceding user message before this model reply
    let userIndex = -1;
    for (let i = modelIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userIndex = i;
        break;
      }
    }
    if (userIndex === -1) return;
    const prevUser = messages[userIndex];
    const baseMessages = messages.slice(0, userIndex);
    const retryImage: AIImageAttachment | null =
      prevUser.imageAttachment && prevUser.imagePreviewUrl
        ? {
            data: prevUser.imageAttachment.data,
            mimeType: prevUser.imageAttachment.mimeType,
            previewUrl: prevUser.imagePreviewUrl,
            name: prevUser.imageName,
          }
        : null;
    await runPrompt(prevUser.text, baseMessages, retryImage);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    if (isLoading) handleStop();
    setMessages([]);
    setStreamingText('');
    setPrompt('');
    setAttachedImage(null);
    setImageError(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[580px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Compact ChatGPT / Gemini Top Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 shrink-0 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                STAR AI Chat
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fast streaming answers for school & general questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Switch */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setSpeedMode('instant')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  speedMode === 'instant'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Instant</span>
              </button>
              <button
                type="button"
                onClick={() => setSpeedMode('balanced')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  speedMode === 'balanced'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Fast & Smart</span>
              </button>
            </div>

            {messages.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  aria-label="Print conversation"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mode Selector Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {modeItems.map(item => {
            const Icon = item.icon;
            const isSelected = selectedMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedMode(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Centered Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !isLoading ? (
            <div className="py-8 sm:py-12 space-y-8">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  How can I help you today?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  Ask anything — math, science, coding, lesson plans, essays, or live STAR AI Academy attendance, fees, and hiring records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presetPrompts[selectedMode].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleGenerate(item.prompt)}
                    className="text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={msg.id} className="w-full">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-xs bg-slate-900 dark:bg-blue-600 text-white text-sm leading-relaxed shadow-2xs space-y-2">
                        {msg.imagePreviewUrl && (
                          <img
                            src={msg.imagePreviewUrl}
                            alt={msg.imageName || 'Uploaded photo'}
                            className="max-h-64 rounded-xl object-contain border border-white/15 bg-black/20"
                          />
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ) : msg.isError ? (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p>{msg.text}</p>
                        <button
                          type="button"
                          onClick={() => handleRegenerate(idx)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Try again</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3.5 group">
                      <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <FormattedAIText
                          text={msg.text}
                          className="text-sm text-slate-800 dark:text-slate-100"
                        />
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleRegenerate(idx)}
                            className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 transition-colors disabled:opacity-40"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Live Streaming Assistant Response */}
              {isLoading && (
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    {streamingText ? (
                      <div className="text-sm text-slate-800 dark:text-slate-100">
                        <FormattedAIText text={streamingText} />
                        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle rounded-xs" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 py-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Bottom-Docked ChatGPT / Gemini Composer Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="max-w-3xl mx-auto">
          {imageError && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
              <span>{imageError}</span>
              <button
                type="button"
                onClick={() => setImageError(null)}
                aria-label="Dismiss image error"
                className="text-rose-400 hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 py-2.5 transition-all space-y-2">
            {attachedImage && (
              <div className="flex items-center gap-2 pt-0.5">
                <div className="relative inline-flex items-center gap-2.5 p-1.5 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <img
                    src={attachedImage.previewUrl}
                    alt={attachedImage.name || 'Selected photo'}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">
                      {attachedImage.name || 'Photo attached'}
                    </p>
                    <p className="text-[11px] text-slate-400">Ready to analyze</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    aria-label="Remove attached photo"
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Choose photo file"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  handleFileSelected(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload photo for AI analysis"
                title="Add photo to ask about it"
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 disabled:opacity-50 flex items-center justify-center shrink-0 transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <label htmlFor="ai-center-prompt" className="sr-only">
                Message STAR AI
              </label>
              <textarea
                ref={textareaRef}
                id="ai-center-prompt"
                rows={1}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder={
                  attachedImage
                    ? 'Ask anything about this photo, or press Enter to analyze...'
                    : 'Message STAR AI or add a photo... (Press Enter to send)'
                }
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden resize-none max-h-40 py-1.5 leading-relaxed"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop generating"
                  className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() && !attachedImage}
                  aria-label="Send message"
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            {speedMode === 'instant' ? 'Instant mode' : 'Fast & Smart mode'} · Upload or paste any photo for instant visual analysis
          </p>
        </div>
      </div>
    </div>
  );
};
