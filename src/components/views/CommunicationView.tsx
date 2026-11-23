import React, { useState } from 'react';
import {
  Plus,
  Bell,
  MessageSquare,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  Users,
  Megaphone,
  Loader2,
} from 'lucide-react';
import {
  Announcement,
  DirectMessage,
  Student,
  Teacher,
  UserAccount,
} from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';

interface CommunicationViewProps {
  announcements: Announcement[];
  messages: DirectMessage[];
  students: Student[];
  teachers: Teacher[];
  currentUser: UserAccount;
  onAddAnnouncement: (ann: Partial<Announcement>) => Promise<any>;
  onSendMessage: (msg: Partial<DirectMessage>) => Promise<any>;
}

const QUICK_MESSAGE_TEMPLATES = [
  {
    label: 'Homework Reminder',
    subject: 'Homework Submission Reminder',
    body: 'Hello! Friendly reminder to complete and submit this week’s assignment via the Student Portal before the due date.',
  },
  {
    label: 'Attendance Check-In',
    subject: 'Attendance Check-In',
    body: 'We noticed an absence in today’s session. Please share an update or medical note if needed so we can help you catch up.',
  },
  {
    label: 'Positive Progress',
    subject: 'Great Academic Progress!',
    body: 'Congratulations on strong class participation and quiz performance this week. Keep up the excellent momentum!',
  },
  {
    label: 'Exam Prep Notice',
    subject: 'Upcoming Midterm Preparation',
    body: 'Please review the syllabus chapters and sample practice questions in the AI Study Buddy ahead of next week’s exam.',
  },
];

export const CommunicationView: React.FC<CommunicationViewProps> = ({
  announcements,
  messages,
  students,
  teachers,
  currentUser,
  onAddAnnouncement,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'circulars'>('messages');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');
  const [isCircularModalOpen, setIsCircularModalOpen] = useState(false);

  // Direct Message Composer state
  const [recipientType, setRecipientType] = useState<'Student' | 'Parent' | 'Class' | 'Teacher'>(
    currentUser.role === 'student' ? 'Teacher' : 'Student'
  );
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    currentUser.role === 'student' ? teachers[0]?.id || 'tch-1' : students[0]?.id || ''
  );
  const [selectedClassTarget, setSelectedClassTarget] = useState<string>('Grade 10-A');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgChannel, setMsgChannel] = useState<'In-App' | 'SMS + WhatsApp' | 'Email + In-App'>('In-App');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Circular modal form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'All' as 'All' | 'Teachers' | 'Students' | 'Parents',
    priority: 'Normal' as 'Normal' | 'High' | 'Emergency',
  });

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredAnnouncements = announcements.filter(
    a => selectedAudience === 'All' || a.targetAudience === 'All' || a.targetAudience === selectedAudience
  );

  const resolveRecipientName = () => {
    if (recipientType === 'Class') return selectedClassTarget;
    if (recipientType === 'Teacher') {
      const t = teachers.find(x => x.id === selectedRecipientId);
      return t ? `${t.firstName} ${t.lastName}` : 'Teacher';
    }
    const s = students.find(x => x.id === selectedRecipientId);
    if (!s) return 'Student';
    return recipientType === 'Parent'
      ? `${s.parentName} (Parent of ${s.firstName} ${s.lastName})`
      : `${s.firstName} ${s.lastName}`;
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim() || isSendingMsg) return;
    if (recipientType !== 'Class' && !selectedRecipientId) return;
    setIsSendingMsg(true);
    try {
      const recipientName = resolveRecipientName();
      await onSendMessage({
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientType,
        recipientId: recipientType === 'Class' ? selectedClassTarget : selectedRecipientId,
        recipientName,
        subject: msgSubject.trim(),
        body: msgBody.trim(),
        channel: msgChannel,
      });
      setMsgSubject('');
      setMsgBody('');
      showToast(`Message delivered instantaneously to ${recipientName}!`);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleAIDraft = async () => {
    if (isDraftingAI) return;
    setIsDraftingAI(true);
    try {
      const targetName = resolveRecipientName();
      const topic = msgSubject.trim() || 'upcoming class milestone and attendance check-in';
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speedMode: 'instant',
          mode: 'universal_qa',
          role: currentUser.role,
          prompt: `Draft a short, warm, clear 2-sentence school message from ${currentUser.name} (${currentUser.role}) to ${targetName} about: "${topic}". Output only the message body text.`,
        }),
      });
      const json = await res.json();
      if (json.success && json.text) {
        setMsgBody(json.text.trim());
        if (!msgSubject.trim()) setMsgSubject(`Update for ${targetName}`);
      }
    } finally {
      setIsDraftingAI(false);
    }
  };

  const handleSubmitCircular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    await onAddAnnouncement({
      title: formData.title,
      content: formData.content,
      targetAudience: formData.targetAudience,
      priority: formData.priority,
      author: currentUser.name,
    });

    showToast(`Circular published to ${formData.targetAudience} across In-App, SMS & WhatsApp!`);
    setIsCircularModalOpen(false);
    setFormData({
      title: '',
      content: '',
      targetAudience: 'All',
      priority: 'Normal',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Fast School Communication Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct teacher–student–parent messaging, class broadcasts, and instant campus circulars.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCircularModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Circular</span>
        </button>
      </div>

      {/* Non-blocking delivery toast */}
      {toast && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Gateway Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Direct Teacher–Student Chat</span>
            <p className="text-[11px] text-emerald-600 font-medium">{messages.length} Active Threads</p>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">WhatsApp & Email Relay</span>
            <p className="text-[11px] text-blue-600 font-medium">Instant Guardian Delivery</p>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Campus Circulars</span>
            <p className="text-[11px] text-amber-600 font-medium">{announcements.length} Active Notices</p>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start text-xs font-semibold w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'messages'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Direct Messages ({messages.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('circulars')}
          className={`px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'circulars'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Campus Circulars ({announcements.length})</span>
        </button>
      </div>

      {/* DIRECT MESSAGES WORKSPACE */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Fast Composer */}
          <form
            onSubmit={handleSendDirectMessage}
            className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5 text-xs h-fit"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Send Fast Message
              </h3>
              <button
                type="button"
                onClick={handleAIDraft}
                disabled={isDraftingAI}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-400/20 text-amber-700 dark:text-amber-300 hover:bg-amber-400/30 flex items-center gap-1 transition-colors"
              >
                {isDraftingAI ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{isDraftingAI ? 'Drafting...' : 'AI Quick Draft'}</span>
              </button>
            </div>

            {/* Quick Template Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MESSAGE_TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    setMsgSubject(tpl.subject);
                    setMsgBody(tpl.body);
                  }}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 transition-colors"
                >
                  + {tpl.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="msg-recipient-type" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Type
                </label>
                <select
                  id="msg-recipient-type"
                  value={recipientType}
                  onChange={e => {
                    const nextType = e.target.value as any;
                    setRecipientType(nextType);
                    if (nextType === 'Teacher') setSelectedRecipientId(teachers[0]?.id || 'tch-1');
                    else if (nextType === 'Student' || nextType === 'Parent') {
                      setSelectedRecipientId(students[0]?.id || '');
                    }
                  }}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Student">Student</option>
                  <option value="Parent">Parent / Guardian</option>
                  <option value="Class">Whole Class</option>
                  <option value="Teacher">Teacher</option>
                </select>
              </div>

              <div>
                <label htmlFor="msg-channel" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Channel
                </label>
                <select
                  id="msg-channel"
                  value={msgChannel}
                  onChange={e => setMsgChannel(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="In-App">In-App Instant</option>
                  <option value="SMS + WhatsApp">SMS + WhatsApp</option>
                  <option value="Email + In-App">Email + In-App</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="msg-recipient" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Recipient
              </label>
              {recipientType === 'Class' ? (
                <select
                  id="msg-recipient"
                  value={selectedClassTarget}
                  onChange={e => setSelectedClassTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Grade 9-A">Grade 9 · Section A</option>
                  <option value="Grade 10-A">Grade 10 · Section A</option>
                  <option value="Grade 10-B">Grade 10 · Section B</option>
                  <option value="Grade 11-A">Grade 11 · Section A</option>
                  <option value="Grade 12-A">Grade 12 · Section A</option>
                </select>
              ) : recipientType === 'Teacher' ? (
                <select
                  id="msg-recipient"
                  value={selectedRecipientId}
                  onChange={e => setSelectedRecipientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.department})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="msg-recipient"
                  value={selectedRecipientId}
                  onChange={e => setSelectedRecipientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {students.length === 0 ? (
                    <option value="">No students enrolled yet</option>
                  ) : (
                    students.map(s => (
                      <option key={s.id} value={s.id}>
                        {recipientType === 'Parent'
                          ? `${s.parentName} (Parent of ${s.firstName} ${s.lastName})`
                          : `${s.firstName} ${s.lastName} (${s.classGrade}-${s.section} · ${s.rollNo})`}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="msg-subject" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <input
                id="msg-subject"
                type="text"
                required
                value={msgSubject}
                onChange={e => setMsgSubject(e.target.value)}
                placeholder="e.g. Homework Feedback or Class Reminder"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="msg-body" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Message *
              </label>
              <textarea
                id="msg-body"
                rows={4}
                required
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                placeholder="Write a clear message..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={
                isSendingMsg ||
                !msgSubject.trim() ||
                !msgBody.trim() ||
                (recipientType !== 'Class' && !selectedRecipientId)
              }
              className="w-full py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingMsg ? 'Sending...' : 'Send Message Now'}</span>
            </button>
          </form>

          {/* Right: Live Message Feed */}
          <div className="lg:col-span-3 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{msg.subject}</span>
                    <Badge
                      variant={
                        msg.recipientType === 'Parent'
                          ? 'warning'
                          : msg.recipientType === 'Class'
                          ? 'primary'
                          : 'success'
                      }
                    >
                      {msg.recipientType}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{msg.body}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    From <strong className="text-slate-800 dark:text-slate-200">{msg.senderName}</strong> →{' '}
                    <strong className="text-blue-600 dark:text-blue-400">{msg.recipientName}</strong>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                    ✓ {msg.channel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CIRCULARS WORKSPACE */}
      {activeTab === 'circulars' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit text-xs font-semibold">
            {(['All', 'Teachers', 'Students', 'Parents'] as const).map(aud => (
              <button
                key={aud}
                type="button"
                onClick={() => setSelectedAudience(aud)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedAudience === aud
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {aud === 'All' ? 'All Audiences' : aud}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAnnouncements.map(ann => (
              <div
                key={ann.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h3>
                    <Badge
                      variant={
                        ann.priority === 'Emergency'
                          ? 'danger'
                          : ann.priority === 'High'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {ann.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Target: {ann.targetAudience}</span>
                    <span>·</span>
                    <span>{ann.date}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Published by: {ann.author}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" /> Broadcast Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish Circular Modal */}
      <Modal
        isOpen={isCircularModalOpen}
        onClose={() => setIsCircularModalOpen(false)}
        title="Publish Circular & Notice"
        subtitle="Broadcasts notification across student portal, parent portal, SMS, and WhatsApp"
      >
        <form onSubmit={handleSubmitCircular} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Circular Headline *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Schedule for Science Fair Prototype Submissions"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Recipient Group
              </label>
              <select
                value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="All">All Campus</option>
                <option value="Teachers">Faculty & Staff</option>
                <option value="Students">Scholars & Students</option>
                <option value="Parents">Parents & Guardians</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority Tier
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Normal">Normal Notification</option>
                <option value="High">High Priority</option>
                <option value="Emergency">Urgent Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Circular Content & Instructions *
            </label>
            <textarea
              rows={4}
              required
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full announcement body..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCircularModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              Broadcast Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
