import React, { useState } from 'react';
import {
  User,
  CalendarCheck,
  Award,
  Wallet,
  Bus,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';
import { SchoolDatabase, Student } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { formatCurrency } from '../../utils/schoolMath.ts';

interface ParentPortalViewProps {
  db: SchoolDatabase;
  onPayFee: (invoiceId: string) => void;
  onNavigateToAI: () => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  db,
  onPayFee,
  onNavigateToAI,
}) => {
  const child: Student | undefined = db.students[0];
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'fees' | 'bus' | 'leave'>('overview');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('2026-11-15');
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  if (!child) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          No Student Linked Yet
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Enroll a student in Principal → Student Directory to unlock their Parent Portal attendance metrics, fee status, report cards, and live bus GPS route.
        </p>
      </div>
    );
  }

  const childMarks = db.marks.filter(m => m.studentId === child.id);
  const childInvoices = db.invoices.filter(i => i.studentId === child.id);
  const childHomework = db.homework.filter(h => h.classGrade === child.classGrade);
  const childBus = db.buses[0];

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason) return;
    setLeaveSubmitted(true);
    setLeaveReason('');
    setTimeout(() => {
      setLeaveSubmitted(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="p-5 rounded-2xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border border-blue-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-400 text-slate-950 font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
              {child.firstName.charAt(0)}{child.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Parent Portal: {child.firstName} {child.lastName}
                </h2>
                <Badge variant="gold">{child.classGrade}-{child.section}</Badge>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Reg: {child.regNo} · Roll: {child.rollNo} · Guardian: {child.parentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToAI}
              className="px-3.5 py-2 text-xs font-semibold bg-white text-blue-950 hover:bg-blue-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask AI Parent Advisor</span>
            </button>
          </div>
        </div>

        {/* Child Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-blue-800/80 text-xs">
          <div>
            <span className="text-blue-300 text-[10px] uppercase font-semibold">Attendance Rate</span>
            <p className="text-base font-bold text-white tabular-nums mt-0.5">{child.attendanceRate}%</p>
          </div>
          <div>
            <span className="text-blue-300 text-[10px] uppercase font-semibold">Latest GPA Average</span>
            <p className="text-base font-bold text-white tabular-nums mt-0.5">3.85 / 4.0</p>
          </div>
          <div>
            <span className="text-blue-300 text-[10px] uppercase font-semibold">Active Assignments</span>
            <p className="text-base font-bold text-white tabular-nums mt-0.5">{childHomework.length} Pending</p>
          </div>
          <div>
            <span className="text-blue-300 text-[10px] uppercase font-semibold">Bus Fleet Route</span>
            <p className="text-base font-bold text-amber-300 mt-0.5">
              {childBus ? `${childBus.routeNumber} (${childBus.liveStatus})` : 'Not Assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
        {(['overview', 'academics', 'fees', 'bus', 'leave'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {tab === 'leave' ? 'Apply for Leave' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Homework */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Current Homework Tasks</span>
              </h3>
              <span className="text-xs text-blue-600 font-medium">View All</span>
            </div>

            <div className="space-y-2.5">
              {childHomework.map(hw => (
                <div
                  key={hw.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{hw.title}</span>
                    <Badge variant="warning">Due {hw.dueDate}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{hw.subjectName} · {hw.teacherName}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Fee Reminders */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>School Fees Status</span>
            </h3>

            <div className="space-y-2.5">
              {childInvoices.map(inv => (
                <div
                  key={inv.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{inv.feeType}</span>
                    <p className="text-[11px] text-slate-500">
                      Amount: {formatCurrency(inv.amount)} · Due {inv.dueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>
                      {inv.status}
                    </Badge>
                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => onPayFee(inv.id)}
                        className="block mt-1 text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Pay Online (UPI)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Academics Tab */}
      {activeTab === 'academics' && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Official Examination Results: {child.firstName} {child.lastName}
          </h3>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3 text-right">Academic Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {childMarks.map(m => (
                <tr key={m.id}>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    {m.subjectName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">{m.marksObtained} / {m.maxMarks}</td>
                  <td className="py-2.5 px-3 text-center text-blue-600 font-bold">{m.grade}</td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <Badge variant="success">{m.remarks || 'Pass'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bus Tracking Tab */}
      {activeTab === 'bus' && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live School Bus GPS Tracking: {childBus.busNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Driver: {childBus.driverName} ({childBus.driverPhone})
              </p>
            </div>
            <Badge variant="success">{childBus.liveStatus}</Badge>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-blue-300">
              <span>SPEED: {childBus.speedKmh} KM/H</span>
              <span>CURRENT STOP: {childBus.currentStop}</span>
            </div>

            {/* Route progression */}
            <div className="space-y-2 pt-2">
              {childBus.stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${i <= 2 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="text-slate-300 flex-1">{stop.name}</span>
                  <span className="text-slate-400 text-[11px]">{stop.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leave Application Tab */}
      {activeTab === 'leave' && (
        <div className="max-w-xl p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Submit Student Leave Application
          </h3>
          <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Requested Absence Date
              </label>
              <input
                type="date"
                value={leaveDate}
                onChange={e => setLeaveDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason for Leave (Medical / Family Event)
              </label>
              <textarea
                rows={3}
                required
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                placeholder="State reason for absence..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={leaveSubmitted}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
            >
              Submit to Academic Supervisor
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
