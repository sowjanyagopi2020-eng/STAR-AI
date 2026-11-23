import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  Send,
  Loader2,
  MessageSquare,
  CalendarCheck,
  User,
  Phone,
  MapPin,
  Droplets,
  Megaphone,
} from 'lucide-react';
import { SchoolDatabase, Student, DirectMessage } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { FormattedAIText } from '../common/FormattedAIText.tsx';
import { AIChatTurn, streamGeminiAnswer } from '../../utils/aiHelpers.ts';

interface StudentPortalViewProps {
  db: SchoolDatabase;
  onSendMessage: (msg: Partial<DirectMessage>) => Promise<any>;
  onNavigateToAI?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  db,
  onSendMessage,
}) => {
  const student: Student | undefined = db.students[0];
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'messages' | 'coursework' | 'study_buddy'
  >('overview');

  // Coursework real stateful submission tracking
  const [submittedHwIds, setSubmittedHwIds] = useState<Record<string, boolean>>({});

  // Student -> Teacher Message Composer
  const [teacherId, setTeacherId] = useState<string>(db.teachers[0]?.id || 'tch-1');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgConfirmation, setMsgConfirmation] = useState<string | null>(null);

  // Study Buddy Mini-Chat inside Student Portal
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'student' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello ${student ? student.firstName : 'Scholar'}! I am your STAR AI Study Buddy. Ask me anything about Math, Physics, Computer Science, homework, or any general question!`,
    },
  ]);
  const [streamingReply, setStreamingReply] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  if (!student) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          No Student Enrolled Yet
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Add a student in Principal → Student Directory to view their academic schedule, attendance logs, coursework, and personalized Study Buddy profile here.
        </p>
      </div>
    );
  }

  const studentMarks = db.marks.filter(m => m.studentId === student.id);
  const studentHomework = db.homework.filter(h => h.classGrade === student.classGrade);
  const studentTimetable = db.timetable.filter(
    t => t.classGrade === student.classGrade && t.section === student.section
  );
  const studentAttendanceLogs = db.attendance.filter(a => a.studentId === student.id);
  const studentMessages = (db.messages || []).filter(
    m =>
      m.recipientId === student.id ||
      m.recipientId === `${student.classGrade}-${student.section}` ||
      m.senderName === `${student.firstName} ${student.lastName}`
  );
  const studentAnnouncements = db.announcements.filter(
    a => a.targetAudience === 'All' || a.targetAudience === 'Students'
  );

  const handleStudentMessageTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim() || isSendingMsg) return;
    setIsSendingMsg(true);
    const selectedTeacher = db.teachers.find(t => t.id === teacherId);
    const teacherName = selectedTeacher
      ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
      : 'Class Teacher';

    try {
      await onSendMessage({
        senderName: `${student.firstName} ${student.lastName}`,
        senderRole: 'student',
        recipientType: 'Teacher',
        recipientId: teacherId,
        recipientName: teacherName,
        subject: msgSubject.trim(),
        body: msgBody.trim(),
        channel: 'In-App',
      });
      setMsgSubject('');
      setMsgBody('');
      setMsgConfirmation(`Message sent to ${teacherName}!`);
      setTimeout(() => setMsgConfirmation(null), 3500);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleAskBuddy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAsking) return;

    const userText = query.trim();
    const history: AIChatTurn[] = chatMessages.slice(1).map(m => ({
      role: m.sender === 'student' ? 'user' : 'model',
      text: m.text,
    }));

    setQuery('');
    setChatMessages(prev => [...prev, { sender: 'student', text: userText }]);
    setIsAsking(true);
    setStreamingReply('');

    try {
      const fullText = await streamGeminiAnswer({
        mode: 'student_assistant',
        speedMode: 'instant',
        prompt: userText,
        role: 'Student',
        history,
        contextData: {
          studentName: `${student.firstName} ${student.lastName}`,
          grade: student.classGrade,
          recentMarks: studentMarks,
        },
        onChunk: (_chunk, accumulated) => setStreamingReply(accumulated),
      });

      setStreamingReply('');
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: fullText || 'No response generated.' },
      ]);
    } catch (err: any) {
      setStreamingReply('');
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: err?.message || 'Unable to connect to Gemini API right now.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="p-5 rounded-2xl bg-linear-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border border-blue-900/60 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xl flex items-center justify-center shrink-0">
              {student.firstName.charAt(0)}
              {student.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Hi, {student.firstName} {student.lastName}!
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  {student.classGrade} · Section {student.section}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5 font-mono">
                Roll: {student.rollNo} · Reg: {student.regNo} · Attendance: {student.attendanceRate}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              <span>Messages ({studentMessages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('study_buddy')}
              className="px-3.5 py-2 text-xs font-semibold bg-linear-to-r from-amber-400 to-yellow-400 text-slate-950 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>AI Study Buddy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {(
          [
            { id: 'overview', label: 'My Info & Schedule' },
            { id: 'attendance', label: 'My Attendance' },
            { id: 'messages', label: `Messages (${studentMessages.length})` },
            { id: 'coursework', label: 'Homework & Marks' },
            { id: 'study_buddy', label: 'AI Study Buddy' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview & My Info Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Profile Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>My Student Information</span>
            </h3>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Registration ID</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{student.regNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date of Birth</span>
                <span className="font-mono text-slate-900 dark:text-white">{student.dateOfBirth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-rose-500" /> Blood Group
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{student.bloodGroup}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Parent / Guardian</p>
                <p className="font-semibold text-slate-900 dark:text-white">{student.parentName}</p>
                <p className="text-slate-500 flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-emerald-600" /> {student.parentPhone}
                </p>
                <p className="text-slate-500 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" /> {student.address}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule & Latest Notices */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Today's Academic Bell Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentTimetable.slice(0, 4).map(slot => (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{slot.subjectName}</span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        {slot.startTime}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{slot.teacherName} · {slot.roomNumber}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  <span>Recent Class Notices</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Open Inbox
                </button>
              </div>
              <div className="space-y-2">
                {studentAnnouncements.slice(0, 2).map(ann => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{ann.title}</span>
                      <Badge variant={ann.priority === 'High' ? 'warning' : 'neutral'}>
                        {ann.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span>My Attendance Record</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current term attendance rate: <strong className="text-emerald-600">{student.attendanceRate}%</strong> (Minimum required: 75%)
              </p>
            </div>
            <Badge variant={student.attendanceRate >= 75 ? 'success' : 'danger'}>
              {student.attendanceRate >= 75 ? 'Good Standing' : 'Attendance Alert'}
            </Badge>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {studentAttendanceLogs.length === 0 ? (
              <p className="py-4 text-slate-500">No dated attendance entries recorded yet.</p>
            ) : (
              studentAttendanceLogs.map(rec => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{rec.date}</span>
                    {rec.remarks && <p className="text-[11px] text-slate-500">{rec.remarks}</p>}
                  </div>
                  <Badge
                    variant={
                      rec.status === 'Present'
                        ? 'success'
                        : rec.status === 'Absent'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {rec.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages & Teacher Chat Tab */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form
            onSubmit={handleStudentMessageTeacher}
            className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs h-fit"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Message a Teacher
            </h3>

            {msgConfirmation && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{msgConfirmation}</span>
              </div>
            )}

            <div>
              <label htmlFor="stu-teacher-select" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Teacher
              </label>
              <select
                id="stu-teacher-select"
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {db.teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stu-msg-subject" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <input
                id="stu-msg-subject"
                type="text"
                required
                value={msgSubject}
                onChange={e => setMsgSubject(e.target.value)}
                placeholder="e.g. Doubt on Homework Question #4"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="stu-msg-body" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Message *
              </label>
              <textarea
                id="stu-msg-body"
                rows={4}
                required
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                placeholder="Write your question or leave update..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingMsg || !msgSubject.trim() || !msgBody.trim()}
              className="w-full py-2 font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingMsg ? 'Sending...' : 'Send to Teacher'}</span>
            </button>
          </form>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              My Inbox & Class Notices
            </h3>
            {studentMessages.length === 0 ? (
              <p className="text-xs text-slate-500">No messages yet.</p>
            ) : (
              studentMessages.map(msg => (
                <div
                  key={msg.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{msg.subject}</span>
                    <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{msg.body}</p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    From <strong className="text-slate-700 dark:text-slate-200">{msg.senderName}</strong> →{' '}
                    <span className="text-blue-600 dark:text-blue-400">{msg.recipientName}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Coursework & Results Tab */}
      {activeTab === 'coursework' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studentHomework.map(hw => {
              const isSubmitted = !!submittedHwIds[hw.id];
              return (
                <div
                  key={hw.id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">
                        {hw.subjectName}
                      </span>
                      <Badge variant={isSubmitted ? 'success' : 'warning'}>
                        {isSubmitted ? 'Submitted' : `Due ${hw.dueDate}`}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hw.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-3">{hw.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => setSubmittedHwIds(prev => ({ ...prev, [hw.id]: true }))}
                      className={`w-full py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                        isSubmitted
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isSubmitted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submitted to {hw.teacherName}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Submit Coursework</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              My Examination Transcripts & Progress
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {studentMarks.map(mark => (
                <div
                  key={mark.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{mark.subjectName}</span>
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">{mark.grade}</span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{mark.marksObtained}</span>
                    <span className="text-slate-400">/ {mark.maxMarks}</span>
                  </div>
                  <Badge variant="success">{mark.remarks || 'Pass'}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Study Buddy Tab */}
      {activeTab === 'study_buddy' && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                STAR AI Study Buddy & Concept Explainer
              </h3>
              <p className="text-xs text-slate-500">
                Powered by Gemini Instant Streaming. Ask any academic, homework, coding, or general question.
              </p>
            </div>
          </div>

          <div className="h-72 overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl p-3 rounded-xl leading-relaxed ${
                    msg.sender === 'student'
                      ? 'bg-blue-600 text-white rounded-br-xs whitespace-pre-wrap'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {msg.sender === 'student' ? msg.text : <FormattedAIText text={msg.text} />}
                </div>
              </div>
            ))}
            {isAsking && (
              <div className="flex justify-start">
                <div className="max-w-xl p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-blue-300 dark:border-blue-800 rounded-bl-xs leading-relaxed">
                  {streamingReply ? (
                    <FormattedAIText text={streamingReply} />
                  ) : (
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Answering...</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAskBuddy} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask a question (e.g., 'Explain Newton's second law with an analogy')..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isAsking || !query.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
