import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  QrCode,
  Fingerprint,
  Save,
  Sparkles,
  BellRing,
  Eye,
  Search,
} from 'lucide-react';
import { Student, AttendanceRecord } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import {
  calculateAttendanceStats,
  findStudentByRollOrReg,
  filterStudentsFast,
} from '../../utils/schoolMath.ts';

interface AttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => Promise<any>;
  onNotifyAbsentees: (date: string, studentIds: string[]) => Promise<any>;
  onInspectStudent: (student: Student) => void;
}

const CLASS_QUICK_PRESETS = [
  { label: 'All Classes', grade: 'All', section: 'All' },
  { label: 'Grade 10 · A', grade: 'Grade 10', section: 'A' },
  { label: 'Grade 10 · B', grade: 'Grade 10', section: 'B' },
  { label: 'Grade 9 · A', grade: 'Grade 9', section: 'A' },
  { label: 'Grade 11 · A', grade: 'Grade 11', section: 'A' },
  { label: 'Grade 12 · A', grade: 'Grade 12', section: 'A' },
];

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendanceRecords,
  onSaveAttendance,
  onNotifyAbsentees,
  onInspectStudent,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-11-11');
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [quickScanCode, setQuickScanCode] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showNotice = (type: 'success' | 'error', text: string) => {
    setBannerNotice({ type, text });
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Build map synced to selectedDate & saved attendanceRecords
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: 'Present' | 'Absent' | 'Late' | 'Excused'; remarks: string }>
  >({});

  useEffect(() => {
    const map: Record<string, { status: 'Present' | 'Absent' | 'Late' | 'Excused'; remarks: string }> = {};
    students.forEach(s => {
      const existing = attendanceRecords.find(
        a => a.date === selectedDate && a.studentId === s.id
      );
      map[s.id] = {
        status: existing?.status || 'Present',
        remarks: existing?.remarks || '',
      };
    });
    setAttendanceState(map);
  }, [selectedDate, attendanceRecords, students]);

  // Filter students belonging to this class & section + search
  const classStudents = filterStudentsFast(
    students.filter(s => {
      const gradeOk = selectedGrade === 'All' || s.classGrade === selectedGrade;
      const sectionOk = selectedSection === 'All' || s.section === selectedSection;
      return gradeOk && sectionOk;
    }),
    searchFilter
  );

  const handleStatusChange = (
    studentId: string,
    status: 'Present' | 'Absent' | 'Late' | 'Excused'
  ) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || '',
      },
    }));
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'Present',
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    setAttendanceState(prev => {
      const next = { ...prev };
      classStudents.forEach(s => {
        next[s.id] = { status, remarks: next[s.id]?.remarks || '' };
      });
      return next;
    });
  };

  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = findStudentByRollOrReg(students, quickScanCode);
    if (!found) {
      showNotice('error', `No student found with Roll or Reg ID "${quickScanCode.trim()}"`);
      return;
    }
    handleStatusChange(found.id, 'Present');
    setSelectedGrade(found.classGrade);
    setSelectedSection(found.section);
    setQuickScanCode('');
    showNotice(
      'success',
      `Checked in ${found.firstName} ${found.lastName} (${found.rollNo}) as Present!`
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const recordsToSave: AttendanceRecord[] = classStudents.map(s => ({
        id: `att-${s.id}-${selectedDate}`,
        date: selectedDate,
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        classGrade: s.classGrade,
        section: s.section,
        status: attendanceState[s.id]?.status || 'Present',
        remarks: attendanceState[s.id]?.remarks || '',
      }));

      await onSaveAttendance(recordsToSave);
      showNotice(
        'success',
        `Attendance saved instantaneously for ${classStudents.length} students on ${selectedDate}.`
      );
    } catch (err: any) {
      showNotice('error', `Failed to save attendance: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const absentStudentIds = classStudents
    .filter(s => attendanceState[s.id]?.status === 'Absent')
    .map(s => s.id);

  const handleNotifyAllAbsentees = async () => {
    if (absentStudentIds.length === 0 || isNotifying) return;
    setIsNotifying(true);
    try {
      const res = await onNotifyAbsentees(selectedDate, absentStudentIds);
      showNotice(
        'success',
        `Sent ${res?.count || absentStudentIds.length} attendance alert(s) to absent students' parents.`
      );
    } catch (err: any) {
      showNotice('error', `Failed to notify parents: ${err.message}`);
    } finally {
      setIsNotifying(false);
    }
  };

  // Calculate live stats for current class
  const currentStatuses = classStudents.map(s => attendanceState[s.id]?.status || 'Present');
  const stats = calculateAttendanceStats(currentStatuses);

  const flaggedStudents = classStudents.filter(s => {
    const hasSavedRecord = attendanceRecords.some(a => a.studentId === s.id);
    const isAbsentToday = attendanceState[s.id]?.status === 'Absent';
    return isAbsentToday || (hasSavedRecord && s.attendanceRate < 75);
  });

  return (
    <div className="space-y-5">
      {/* Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Fast Class Attendance & Roll Call
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            One-click roll call, instant QR/Roll check-in, full student dossiers & automated parent alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {absentStudentIds.length > 0 && (
            <button
              type="button"
              onClick={handleNotifyAllAbsentees}
              disabled={isNotifying}
              className="px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>
                {isNotifying
                  ? 'Notifying...'
                  : `Notify ${absentStudentIds.length} Absent Parent${absentStudentIds.length > 1 ? 's' : ''}`}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || classStudents.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Non-blocking Toast Banner */}
      {bannerNotice && (
        <div
          role="status"
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bannerNotice.text}</span>
        </div>
      )}

      {/* 1-Click Class Quick Pills + QR Roll Scan */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Class Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CLASS_QUICK_PRESETS.map(preset => {
              const active =
                selectedGrade === preset.grade && selectedSection === preset.section;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedGrade(preset.grade);
                    setSelectedSection(preset.section);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Live Attendance Counters */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-sans">PRESENT</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {stats.presentCount}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-sans">LATE</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                {stats.lateCount}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-sans">ABSENT</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                {stats.absentCount}
              </span>
            </div>
            <div className="text-center pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">RATE</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                {stats.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Date, Search & Instant QR/Roll Check-In */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label htmlFor="att-date" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Attendance Date
            </label>
            <input
              id="att-date"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="att-search" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Filter Students
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="att-search"
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Name, roll no, parent..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <form onSubmit={handleQuickScanSubmit}>
            <label htmlFor="att-qr" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Instant Roll / QR Check-In
            </label>
            <div className="flex gap-1.5">
              <input
                id="att-qr"
                type="text"
                value={quickScanCode}
                onChange={e => setQuickScanCode(e.target.value)}
                placeholder="Enter Roll (e.g. 10A-02) + Enter"
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shrink-0"
              >
                Check In
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Integration Status & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Fingerprint className="w-4 h-4" />
            <span className="font-medium text-[11px]">Biometric Gate Sync: Live</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <QrCode className="w-4 h-4" />
            <span className="font-medium text-[11px]">Click any student name for full Student Info</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={classStudents.length === 0}
            onClick={() => handleMarkAll('Present')}
            className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            Mark All Present
          </button>
          <button
            type="button"
            disabled={classStudents.length === 0}
            onClick={() => handleMarkAll('Absent')}
            className="px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 rounded border border-rose-200 dark:border-rose-800 hover:bg-rose-100 disabled:opacity-50 transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* AI Attendance Pattern Insights */}
      {flaggedStudents.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Attendance Attention Required
            </h4>
            <p className="text-amber-900/80 dark:text-amber-300/80">
              {flaggedStudents
                .map(s => `${s.firstName} ${s.lastName} (${s.attendanceRate}%)`)
                .join(', ')}{' '}
              — click "Notify Absent Parents" above or click a student to message their guardian directly.
            </p>
          </div>
        </div>
      )}

      {/* Students Roll Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Roll</th>
              <th className="py-3 px-4">Student Info</th>
              <th className="py-3 px-4">Rate</th>
              <th className="py-3 px-4">Mark Attendance</th>
              <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4 text-right">Dossier & Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {classStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  {students.length === 0
                    ? 'No students enrolled yet. Add students in Student Directory to take roll call.'
                    : `No students matching ${selectedGrade} (${selectedSection}).`}
                </td>
              </tr>
            ) : (
              classStudents.map(student => {
                const current = attendanceState[student.id] || { status: 'Present', remarks: '' };
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-200">
                      {student.rollNo}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onInspectStudent(student)}
                        className="text-left group"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500">
                          {student.classGrade}-{student.section} · Parent: {student.parentName}
                        </p>
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                        <span className={student.attendanceRate < 75 ? 'text-rose-600 font-bold' : ''}>
                          {student.attendanceRate}%
                        </span>
                        {student.attendanceRate < 75 && <Badge variant="danger">Low</Badge>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {(['Present', 'Late', 'Absent', 'Excused'] as const).map(st => {
                          const isSelected = current.status === st;
                          const colorMap = {
                            Present: 'bg-emerald-600 text-white shadow-2xs',
                            Late: 'bg-amber-400 text-slate-950 shadow-2xs',
                            Absent: 'bg-rose-600 text-white shadow-2xs',
                            Excused: 'bg-blue-600 text-white shadow-2xs',
                          };
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(student.id, st)}
                              aria-label={`Mark ${student.firstName} ${student.lastName} ${st}`}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                isSelected
                                  ? colorMap[st]
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={current.remarks}
                        onChange={e => handleRemarkChange(student.id, e.target.value)}
                        placeholder="Reason / note..."
                        aria-label={`Remarks for ${student.firstName} ${student.lastName}`}
                        className="w-full min-w-[130px] px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onInspectStudent(student)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Info & Msg</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
