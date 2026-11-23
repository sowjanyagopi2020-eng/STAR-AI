import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Zap,
  BrainCircuit,
  Trash2,
  Square,
  AlertCircle,
  Copy,
  Check,
  ImagePlus,
} from 'lucide-react';
import { UserAccount } from '../../types/school.ts';
import {
  AISpeedMode,
  AIChatTurn,
  AIImageAttachment,
  DEFAULT_IMAGE_PROMPT,
  readImageFileForAI,
  streamGeminiAnswer,
} from '../../utils/aiHelpers.ts';
import { FormattedAIText } from './FormattedAIText.tsx';

interface QuickAskDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  currentUser: UserAccount;
}

interface QuickMessage extends AIChatTurn {
  id: string;
  ttfbMs?: number;
  isError?: boolean;
}

export const QuickAskDrawer: React.FC<QuickAskDrawerProps> = ({
  isOpen,
  onOpen,
  onClose,
  currentUser,
}) => {
  const [speedMode, setSpeedMode] = useState<AISpeedMode>('instant');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<AIImageAttachment | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onOpen, onClose]);

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamingText.trim()) {
      setMessages(prev => [
        ...prev,
        { id: `m-${Date.now()}`, role: 'model', text: streamingText },
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
      setTimeout(() => inputRef.current?.focus(), 40);
    } catch (err: any) {
      setImageError(err?.message || 'Could not load image.');
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
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

  const handleAsk = async (e?: React.FormEvent, preset?: string) => {
    e?.preventDefault();
    const typedText = (preset ?? question).trim();
    const activeImage = preset ? null : attachedImage;
    if ((!typedText && !activeImage) || isLoading) return;

    const q = typedText || DEFAULT_IMAGE_PROMPT;
    const displayPrompt = typedText || 'Analyze this image';

    const history: AIChatTurn[] = messages
      .filter(m => !m.isError)
      .map(m => ({ role: m.role, text: m.text }));

    setMessages(prev => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: 'user',
        text: displayPrompt,
        imagePreviewUrl: activeImage?.previewUrl,
        imageName: activeImage?.name,
      },
    ]);
    if (!preset) {
      setQuestion('');
      setAttachedImage(null);
      setImageError(null);
    }
    setIsLoading(true);
    setStreamingText('');

    const controller = new AbortController();
    abortRef.current = controller;
    let firstTokenMs: number | undefined;

    try {
      const fullText = await streamGeminiAnswer({
        prompt: q,
        image: activeImage ? { data: activeImage.data, mimeType: activeImage.mimeType } : undefined,
        mode: 'universal_qa',
        speedMode,
        role: currentUser.role,
        history,
        signal: controller.signal,
        onFirstToken: ttfb => {
          firstTokenMs = ttfb;
        },
        onChunk: (_c, acc) => setStreamingText(acc),
      });

      setStreamingText('');
      setMessages(prev => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: fullText || 'No response generated.',
          ttfbMs: firstTokenMs,
        },
      ]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setStreamingText('');
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'model',
          text: err?.message || 'Unable to get Gemini response.',
          isError: true,
        },
      ]);
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Quick-Ask Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Quick Ask STAR AI"
          className="no-print fixed bottom-5 right-5 z-40 px-4 py-3 rounded-full bg-linear-to-r from-blue-950 via-blue-800 to-indigo-800 text-white shadow-xl border border-amber-400/50 hover:scale-105 transition-transform flex items-center gap-2 text-xs font-bold"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Ask STAR AI</span>
        </button>
      )}

      {/* Slide-over Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Quick Ask STAR AI"
          className="no-print fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[440px] h-[560px] max-h-[82vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="px-4 py-3 bg-linear-to-r from-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <div>
                <h3 className="text-xs font-bold leading-tight">STAR AI Instant Q&A</h3>
                <p className="text-[10px] text-blue-200">Answers all questions in real time</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSpeedMode(speedMode === 'instant' ? 'balanced' : 'instant')}
                title="Toggle AI speed mode"
                className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-amber-300 flex items-center gap-1"
              >
                {speedMode === 'instant' ? <Zap className="w-3 h-3" /> : <BrainCircuit className="w-3 h-3" />}
                <span>{speedMode === 'instant' ? 'Instant' : 'Smart'}</span>
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (isLoading) handleStop();
                    setMessages([]);
                    setStreamingText('');
                  }}
                  aria-label="Clear quick chat"
                  className="p-1.5 rounded-md hover:bg-white/10 text-blue-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Quick Ask AI"
                className="p-1.5 rounded-md hover:bg-white/10 text-blue-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && !isLoading && (
              <div className="space-y-3 py-4">
                <p className="text-slate-500 dark:text-slate-400 text-center text-xs">
                  Ask anything — school stats, homework, math, coding, science, or general questions.
                </p>
                <div className="space-y-1.5">
                  {[
                    'Who is absent today?',
                    'What is the pending fee total?',
                    'Explain photosynthesis simply',
                    'Solve 3x + 7 = 22',
                  ].map(sample => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => handleAsk(undefined, sample)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.isError ? (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{m.text}</span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[88%] px-3 py-2.5 rounded-xl leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs whitespace-pre-wrap'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <div className="space-y-1.5">
                        {m.imagePreviewUrl && (
                          <img
                            src={m.imagePreviewUrl}
                            alt={m.imageName || 'Uploaded photo'}
                            className="max-h-40 rounded-lg object-cover border border-white/20"
                          />
                        )}
                        <p>{m.text}</p>
                      </div>
                    ) : (
                      <FormattedAIText text={m.text} />
                    )}
                    {m.role === 'model' && (
                      <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/70 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(m.text);
                            setCopiedId(m.id);
                            setTimeout(() => setCopiedId(null), 1800);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[88%] px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-blue-300 dark:border-blue-800 leading-relaxed">
                  {streamingText ? (
                    <>
                      <FormattedAIText text={streamingText} />
                      <span className="inline-block w-1.5 h-3.5 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                    </span>
                  )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input & Photo Upload */}
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            {imageError && (
              <div className="px-3 pt-2 text-[11px] text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2">
                <span>{imageError}</span>
                <button
                  type="button"
                  onClick={() => setImageError(null)}
                  aria-label="Dismiss image error"
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {attachedImage && (
              <div className="px-3 pt-2.5 flex items-center gap-2">
                <div className="relative inline-flex items-center gap-2 p-1.5 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img
                    src={attachedImage.previewUrl}
                    alt={attachedImage.name || 'Selected photo'}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-200 max-w-[180px] truncate">
                    {attachedImage.name || 'Photo ready'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    aria-label="Remove attached photo"
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleAsk} className="p-3 flex items-center gap-2">
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
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 transition-colors shrink-0"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onPaste={handlePaste}
                placeholder={attachedImage ? 'Ask about this photo (or send directly)...' : 'Ask anything or add a photo...'}
                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop generating"
                  className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shrink-0"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!question.trim() && !attachedImage}
                  aria-label="Send question"
                  className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};
