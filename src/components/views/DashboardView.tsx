import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  UserX,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowUpRight,
  Plus,
  FileText,
  Bus,
  CheckCircle2,
} from 'lucide-react';
import { SchoolDatabase, UserAccount, Student, DirectMessage } from '../../types/school.ts';
import { formatCurrency, calculateFeeSummary, calculateAttendanceStats } from '../../utils/schoolMath.ts';
import { Badge } from '../common/Badge.tsx';
import { StarAILogo } from '../common/StarAILogo.tsx';

interface DashboardViewProps {
  db: SchoolDatabase;
  currentUser: UserAccount;
  onNavigate: (tab: any) => void;
  onOpenNewAdmission: () => void;
  onOpenFeePayment: () => void;
  onInspectStudent?: (student: Student) => void;
  onSendMessage?: (msg: Partial<DirectMessage>) => Promise<any>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  currentUser,
  onNavigate,
  onOpenNewAdmission,
  onOpenFeePayment,
  onInspectStudent,
  onSendMessage,
}) => {
  const [alertedIds, setAlertedIds] = useState<Record<string, boolean>>({});
  const totalStudents = db.students.length;
  const totalTeachers = db.teachers.length;
  const totalClasses = 12; // Standard grades 1-12

  // Attendance metrics
  const todayAttendanceRecords = db.attendance.map(a => a.status);
  const attendanceStats = calculateAttendanceStats(todayAttendanceRecords);
  const absentees = db.attendance.filter(a => a.status === 'Absent');
  const newAdmissionsCount = db.students.filter(s => s.admissionDate >= '2026-11-01').length;
  const waitingTeachersCount = (db.teacherApplicants || []).filter(
    a => a.interviewStatus !== 'Hired' && a.interviewStatus !== 'Declined'
  ).length;
  const pendingEnquiriesCount = db.enquiries.filter(
    e => e.status === 'New' || e.status === 'Follow-up'
  ).length;

  // Fee summary
  const feeSummary = calculateFeeSummary(db.invoices);

  // Total expenses
  const totalExpenses = db.expenses.reduce((acc, e) => acc + e.amount, 0);

  // Grade breakdown
  const gradeCounts: Record<string, number> = {};
  db.students.forEach(s => {
    gradeCounts[s.classGrade] = (gradeCounts[s.classGrade] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border border-blue-900/60 shadow-lg">
        <div className="flex items-center gap-4">
          <StarAILogo size={54} className="shrink-0 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                Welcome back, {currentUser.name}
              </h1>
              <span className="text-[10px] font-semibold bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded border border-blue-400/40 capitalize">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-1 max-w-xl">
              {attendanceStats.totalSessions > 0
                ? `STAR AI campus operations are synchronized. ${attendanceStats.percentage}% attendance logged across ${attendanceStats.totalSessions} marked students.`
                : 'STAR AI campus operations are synchronized. Ready for daily attendance roll call with zero reported transport delays.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenNewAdmission}
            className="px-3 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Admission</span>
          </button>
          <button
            onClick={onOpenFeePayment}
            className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Collect Fee</span>
          </button>
          <button
            onClick={() => onNavigate('ai_center')}
            className="px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Total Students</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {totalStudents}
            </span>
            {newAdmissionsCount > 0 && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                +{newAdmissionsCount} new admissions
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across Grades 9 to 12</div>
        </div>

        {/* Total Teachers */}
        <div
          onClick={() => onNavigate('staff')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Faculty & Hiring</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {totalTeachers}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              {waitingTeachersCount} waiting to hire
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Click to review job applicants</div>
        </div>

        {/* Today's Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Today's Attendance</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {attendanceStats.totalSessions > 0 ? `${attendanceStats.percentage}%` : 'No Log'}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {attendanceStats.totalSessions > 0 ? `${attendanceStats.presentCount} Present` : '0 Marked'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {attendanceStats.totalSessions > 0
              ? `${attendanceStats.absentCount} absentees logged`
              : 'Click to mark roll call'}
          </div>
        </div>

        {/* Pending Fee Dues */}
        <div
          onClick={() => onNavigate('fees')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Pending Fees</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(feeSummary.totalPending)}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              {feeSummary.collectionPercentage}% collected
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Collected: {formatCurrency(feeSummary.totalCollected)}
          </div>
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Fee Collected */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Fee Collection</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {formatCurrency(feeSummary.totalCollected)}
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, feeSummary.collectionPercentage)}%` }}
            />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Monthly Expenses</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Payroll & Lab Infrastructure</p>
        </div>

        {/* Upcoming Examinations */}
        <div
          onClick={() => onNavigate('examinations')}
          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors"
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Upcoming Exams</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {db.exams.filter(e => e.status === 'Upcoming').length} Scheduled
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Mid-Term starting Nov 20</p>
        </div>

        {/* Admission Enquiries */}
        <div
          onClick={() => (pendingEnquiriesCount > 0 ? onNavigate('students') : onOpenNewAdmission())}
          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors"
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Admission Enquiries</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {pendingEnquiriesCount > 0 ? `${pendingEnquiriesCount} Ready to Enroll` : 'No Pending Enquiries'}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
            {pendingEnquiriesCount > 0 ? 'Click to admit applicants' : 'Click to add a new admission'}
          </p>
        </div>
      </div>

      {/* AI Real-time School Insights Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                STAR AI Executive Intelligence
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium px-1.5 py-0.2 rounded">
                Live Analysis
              </span>
            </div>
            <p className="text-xs text-amber-950/80 dark:text-amber-200/80 mt-0.5">
              {absentees.length > 0
                ? `Attendance alert: ${absentees.map(a => `${a.studentName} (${a.classGrade}-${a.section})`).join(', ')} marked absent. Fee collection is at ${feeSummary.collectionPercentage}% with ${db.buses.filter(b => b.liveStatus === 'On Route').length} buses active on route.`
                : attendanceStats.totalSessions > 0
                ? `All ${attendanceStats.totalSessions} marked attendance entries have zero absentees today. Fee collection is at ${feeSummary.collectionPercentage}% with ${db.buses.filter(b => b.liveStatus === 'On Route').length} buses active on route.`
                : `No attendance roll call logged yet today. Fee collection is at ${feeSummary.collectionPercentage}% with ${db.buses.filter(b => b.liveStatus === 'On Route').length} buses active on route.`}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('ai_center')}
          className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shrink-0 transition-colors shadow-2xs"
        >
          Ask AI Principal
        </button>
      </div>

      {/* Interactive Charts & Data Grids Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Grade Distribution & Attendance Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Strength & Performance Graph */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Student Strength by Class Grade
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active institutional enrollment distribution</p>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 tabular-nums">
                Total: {totalStudents} Students
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="space-y-3 pt-2">
              {Object.keys(gradeCounts).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No students enrolled yet. Click{' '}
                  <button
                    type="button"
                    onClick={onOpenNewAdmission}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + New Admission
                  </button>{' '}
                  to add your own scholars.
                </div>
              ) : (
                Object.entries(gradeCounts).map(([grade, count]) => {
                  const max = Math.max(...Object.values(gradeCounts), 5);
                  const percent = Math.round((count / max) * 100);
                  return (
                    <div key={grade} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{grade}</span>
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums font-mono">{count} Students</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-md transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Absentees List & Action Roster */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Absentee Log
                </h3>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
              >
                <span>Full Roster</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {absentees.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                {db.attendance.length === 0
                  ? 'No attendance logged yet. Open Full Roster to record roll call.'
                  : 'No students absent today. 100% attendance!'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {absentees.map(rec => {
                  const student = db.students.find(s => s.id === rec.studentId);
                  const isAlerted = alertedIds[rec.studentId];
                  return (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => student && onInspectStudent?.(student)}
                          className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left"
                        >
                          {rec.studentName}
                        </button>
                        <p className="text-[11px] text-slate-500">
                          {rec.classGrade} · Section {rec.section} · Parent: {student?.parentName} ({student?.parentPhone})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="danger">Absent</Badge>
                        <button
                          type="button"
                          disabled={isAlerted}
                          onClick={async () => {
                            if (student && onSendMessage) {
                              await onSendMessage({
                                senderName: currentUser.name,
                                senderRole: currentUser.role,
                                recipientType: 'Parent',
                                recipientId: student.id,
                                recipientName: `${student.parentName} (Parent of ${student.firstName})`,
                                subject: `Attendance Alert (${rec.date})`,
                                body: `Dear ${student.parentName}, ${student.firstName} ${student.lastName} was marked Absent on ${rec.date}. Please reply if you need classwork updates.`,
                                channel: 'SMS + WhatsApp',
                              });
                            }
                            setAlertedIds(prev => ({ ...prev, [rec.studentId]: true }));
                          }}
                          className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors flex items-center gap-1 ${
                            isAlerted
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          {isAlerted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Parent Alerted</span>
                            </>
                          ) : (
                            <span>Alert Parent</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activities, Fleet & Announcements */}
        <div className="space-y-6">
          {/* Live Transport Overview */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Transport Fleet</h3>
              </div>
              <button
                onClick={() => onNavigate('transport')}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Track GPS
              </button>
            </div>

            <div className="space-y-2.5">
              {db.buses.slice(0, 3).map(bus => (
                <div
                  key={bus.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{bus.routeNumber}</span>
                    <Badge variant={bus.liveStatus === 'On Route' ? 'success' : 'neutral'}>
                      {bus.liveStatus}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Current: {bus.currentStop} · {bus.activeStudents}/{bus.capacity} onboard
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements & Circulars Feed */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">School Circulars</h3>
              <button
                onClick={() => onNavigate('communication')}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {db.announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="text-xs border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">{ann.title}</span>
                    <Badge variant={ann.priority === 'High' ? 'danger' : 'neutral'}>
                      {ann.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {ann.content}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block font-mono">{ann.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
