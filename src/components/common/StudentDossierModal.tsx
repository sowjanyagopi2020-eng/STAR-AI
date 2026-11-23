import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  CalendarCheck,
  Award,
  Wallet,
  Send,
  CheckCircle2,
  Droplets,
  UserCheck,
} from 'lucide-react';
import {
  Student,
  SchoolDatabase,
  DirectMessage,
  UserAccount,
} from '../../types/school.ts';
import { Modal } from './Modal.tsx';
import { Badge } from './Badge.tsx';
import { computeStudentDossierMetrics, formatCurrency } from '../../utils/schoolMath.ts';

interface StudentDossierModalProps {
  student: Student | null;
  db: SchoolDatabase;
  currentUser: UserAccount;
  onClose: () => void;
  onSendMessage: (msg: Partial<DirectMessage>) => Promise<any>;
}

export const StudentDossierModal: React.FC<StudentDossierModalProps> = ({
  student,
  db,
  currentUser,
  onClose,
  onSendMessage,
}) => {
  const [recipientTarget, setRecipientTarget] = useState<'Parent' | 'Student'>('Parent');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  if (!student) return null;

  const metrics = computeStudentDossierMetrics(student.id, db.marks, db.invoices);
  const studentMarks = db.marks.filter(m => m.studentId === student.id);
  const studentAttendance = db.attendance.filter(a => a.studentId === student.id).slice(-5);
  const studentMessages = (db.messages || []).filter(
    m => m.recipientId === student.id || m.senderName === `${student.firstName} ${student.lastName}`
  );

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSendMessage({
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientType: recipientTarget,
        recipientId: student.id,
        recipientName:
          recipientTarget === 'Parent'
            ? `${student.parentName} (Parent of ${student.firstName})`
            : `${student.firstName} ${student.lastName}`,
        subject: subject.trim() || `Message regarding ${student.firstName} ${student.lastName}`,
        body: body.trim(),
        channel: recipientTarget === 'Parent' ? 'SMS + WhatsApp' : 'In-App',
      });
      setSentNotice(
        `Sent to ${recipientTarget === 'Parent' ? student.parentName : student.firstName}!`
      );
      setSubject('');
      setBody('');
      setTimeout(() => setSentNotice(null), 3500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={!!student}
      onClose={onClose}
      title={`${student.firstName} ${student.lastName} — Complete Student Dossier`}
      subtitle={`${student.regNo} · Roll ${student.rollNo} · ${student.classGrade} (Section ${student.section})`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Identity & KPI Strip */}
        <div className="p-4 rounded-xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {student.firstName.charAt(0)}
              {student.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold">
                  {student.firstName} {student.lastName}
                </h4>
                <Badge variant={student.status === 'Active' ? 'success' : 'warning'}>
                  {student.status}
                </Badge>
              </div>
              <p className="text-blue-200 mt-0.5">
                {student.classGrade} · Section {student.section} · DOB: {student.dateOfBirth}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-blue-200/90 font-mono">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-rose-400" /> {student.bloodGroup}
                </span>
                <span>·</span>
                <span>Admitted {student.admissionDate}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center bg-white/10 rounded-xl px-4 py-2.5 shrink-0">
            <div>
              <span className="text-[10px] text-blue-200 uppercase block">Attendance</span>
              <span
                className={`text-sm font-bold font-mono ${
                  student.attendanceRate < 75 ? 'text-rose-300' : 'text-emerald-300'
                }`}
              >
                {student.attendanceRate}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-blue-200 uppercase block">Avg Score</span>
              <span className="text-sm font-bold font-mono text-amber-300">
                {metrics.examsCount > 0 ? `${metrics.averagePercentage}%` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-blue-200 uppercase block">Fee Due</span>
              <span className="text-sm font-bold font-mono text-white">
                {formatCurrency(metrics.totalPendingFee)}
              </span>
            </div>
          </div>
        </div>

        {/* Contact & Attendance Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Guardian & Contact Details
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">{student.parentName}</p>
            <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono">
              <Phone className="w-3 h-3 text-emerald-600" /> {student.parentPhone} (Emergency:{' '}
              {student.emergencyContact})
            </p>
            <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
              <Mail className="w-3 h-3 text-blue-600" /> {student.parentEmail}
            </p>
            <p className="text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
              <MapPin className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" /> {student.address}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Academic Marks & Recent Attendance
            </p>
            {studentMarks.length > 0 ? (
              <div className="space-y-1">
                {studentMarks.slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{m.subjectName}</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {m.marksObtained}/{m.maxMarks}{' '}
                      <span className="text-blue-600 dark:text-blue-400">({m.grade})</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No examination marks recorded yet.</p>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] text-slate-500">Logs:</span>
              {studentAttendance.length > 0 ? (
                studentAttendance.map(a => (
                  <Badge
                    key={a.id}
                    variant={
                      a.status === 'Present'
                        ? 'success'
                        : a.status === 'Absent'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {a.date.slice(5)}: {a.status}
                  </Badge>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">No dated logs yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Direct Quick Message Box */}
        <form
          onSubmit={handleQuickSend}
          className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              Quick Message
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['Parent', 'Student'] as const).map(target => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setRecipientTarget(target)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    recipientTarget === target
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {target === 'Parent' ? `Parent (${student.parentName})` : `Student (${student.firstName})`}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject (optional, e.g. Homework Update or Attendance Note)"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />

          <div className="flex gap-2">
            <input
              type="text"
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={`Write a quick message to ${recipientTarget === 'Parent' ? student.parentName : student.firstName}...`}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSending || !body.trim()}
              className="px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>

          {sentNotice && (
            <p className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {sentNotice}
            </p>
          )}
        </form>

        {/* Recent Communication History for this Student */}
        {studentMessages.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Recent Messages ({studentMessages.length})
            </p>
            <div className="max-h-28 overflow-y-auto space-y-1.5">
              {studentMessages.slice(0, 3).map(msg => (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-2"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{msg.subject}</p>
                    <p className="text-slate-600 dark:text-slate-300">{msg.body}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
