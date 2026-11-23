import React, { useState } from 'react';
import {
  CalendarDays,
  BookOpen,
  Clock,
  Plus,
  FileCheck,
  Sparkles,
  Users,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { TimetableSlot, Homework, Teacher } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';

interface AcademicsViewProps {
  timetable: TimetableSlot[];
  homeworkList: Homework[];
  teachers: Teacher[];
  onAddHomework: (hw: Partial<Homework>) => Promise<any>;
}

export const AcademicsView: React.FC<AcademicsViewProps> = ({
  timetable,
  homeworkList,
  teachers,
  onAddHomework,
}) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'homework' | 'curriculum'>('timetable');
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [isHwModalOpen, setIsHwModalOpen] = useState(false);
  const [hwError, setHwError] = useState<string | null>(null);

  const [hwFormData, setHwFormData] = useState({
    title: '',
    description: '',
    subjectName: 'Mathematics',
    teacherName: 'Prof. Sarah Jenkins',
    classGrade: 'Grade 10',
    section: 'A',
    dueDate: '2026-11-18',
  });

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const periods = [1, 2, 3, 4, 5];

  const handleHwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwFormData.title) {
      setHwError('Please enter homework title.');
      return;
    }
    setHwError(null);
    await onAddHomework(hwFormData);
    setIsHwModalOpen(false);
    setHwFormData({
      title: '',
      description: '',
      subjectName: 'Mathematics',
      teacherName: 'Prof. Sarah Jenkins',
      classGrade: 'Grade 10',
      section: 'A',
      dueDate: '2026-11-18',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Academic Management & Scheduling
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Timetable allocation, curriculum pacing, lesson tracking, and student homework assignments.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'timetable'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Weekly Timetable
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'homework'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Homework & Assignments
          </button>
        </div>
      </div>

      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {/* Class Filters */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Viewing Schedule For:
              </span>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>

              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Bell Schedule: <span className="font-mono text-slate-900 dark:text-white">08:30 AM – 02:45 PM</span>
            </div>
          </div>

          {/* Timetable Interactive Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 w-28">Day</th>
                    {periods.map(p => (
                      <th key={p} className="py-3 px-4 min-w-[150px]">
                        Period {p}
                        <span className="block text-[9px] font-mono text-slate-400 font-normal">
                          {p === 1 && '08:30 – 09:20'}
                          {p === 2 && '09:25 – 10:15'}
                          {p === 3 && '10:30 – 11:20'}
                          {p === 4 && '11:25 – 12:15'}
                          {p === 5 && '01:00 – 01:50'}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {days.map(day => (
                    <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white bg-slate-50/40 dark:bg-slate-800/30">
                        {day}
                      </td>
                      {periods.map(periodNum => {
                        const slot = timetable.find(
                          t =>
                            t.day === day &&
                            t.periodNumber === periodNum &&
                            t.classGrade === selectedGrade &&
                            t.section === selectedSection
                        );

                        if (!slot) {
                          return (
                            <td key={periodNum} className="py-3 px-4 text-slate-400 text-[11px] italic">
                              Self-Study / Lab Prep
                            </td>
                          );
                        }

                        return (
                          <td key={periodNum} className="py-3 px-4">
                            <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                {slot.subjectName}
                              </p>
                              <p className="text-[10px] text-blue-700 dark:text-blue-300">
                                {slot.teacherName}
                              </p>
                              <span className="text-[9px] font-mono text-slate-500 block">
                                {slot.roomNumber}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Active student coursework assignments and submission tracker.
            </p>
            <button
              onClick={() => setIsHwModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Homework</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeworkList.map(hw => (
              <div
                key={hw.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {hw.subjectName}
                    </span>
                    <Badge variant="warning">Due {hw.dueDate}</Badge>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hw.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-3">{hw.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Instructor: {hw.teacherName}</span>
                    <span>{hw.classGrade} ({hw.section})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Submissions:</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {hw.submissionsCount} / {hw.totalStudents} ({Math.round((hw.submissionsCount / (hw.totalStudents || 1)) * 100)}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.round((hw.submissionsCount / (hw.totalStudents || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Homework Modal */}
      <Modal
        isOpen={isHwModalOpen}
        onClose={() => setIsHwModalOpen(false)}
        title="Post Homework Assignment"
        subtitle="Dispatches curriculum tasks to student and parent portals"
      >
        <form onSubmit={handleHwSubmit} className="space-y-3 text-xs">
          {hwError && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
              {hwError}
            </div>
          )}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              value={hwFormData.title}
              onChange={e => setHwFormData({ ...hwFormData, title: e.target.value })}
              placeholder="e.g. Thermodynamics Lab Synthesis Problems"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={hwFormData.subjectName}
                onChange={e => setHwFormData({ ...hwFormData, subjectName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={hwFormData.dueDate}
                onChange={e => setHwFormData({ ...hwFormData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Detailed Instructions
            </label>
            <textarea
              rows={3}
              value={hwFormData.description}
              onChange={e => setHwFormData({ ...hwFormData, description: e.target.value })}
              placeholder="Provide problem numbers, lab rubric, and required references..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsHwModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              Publish Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
