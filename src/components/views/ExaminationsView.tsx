import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Plus,
  FileCheck2,
  Printer,
  TrendingUp,
  Search,
  CheckCircle,
} from 'lucide-react';
import { Exam, MarkRecord, Student } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { StarAILogo } from '../common/StarAILogo.tsx';
import { calculateStudentGrade } from '../../utils/schoolMath.ts';

interface ExaminationsViewProps {
  exams: Exam[];
  marks: MarkRecord[];
  students: Student[];
  onSaveMark: (markData: any) => Promise<any>;
}

export const ExaminationsView: React.FC<ExaminationsViewProps> = ({
  exams,
  marks,
  students,
  onSaveMark,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[1]?.id || exams[0]?.id || 'ex-2');
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  // Form for marks entry
  const [entryData, setEntryData] = useState({
    studentId: students[0]?.id || '',
    subjectName: 'Mathematics',
    marksObtained: 90,
    maxMarks: 100,
  });

  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Filter marks for this exam and class
  const currentMarks = marks.filter(m => m.examId === selectedExamId);

  const handleMarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === entryData.studentId);
    if (!student) return;

    await onSaveMark({
      examId: selectedExamId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      classGrade: student.classGrade,
      section: student.section,
      subjectName: entryData.subjectName,
      marksObtained: Number(entryData.marksObtained),
      maxMarks: Number(entryData.maxMarks),
    });

    setIsEntryModalOpen(false);
  };

  // Student specific marks for report card
  const getStudentMarks = (studentId: string) => {
    return marks.filter(m => m.examId === selectedExamId && m.studentId === studentId);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Examinations & Academic Report Cards
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Standardized assessments, rubric scoring, GPA computation, and official transcript generation.
          </p>
        </div>

        <button
          onClick={() => setIsEntryModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Scholar Marks</span>
        </button>
      </div>

      {/* Exam Selector Strip */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Select Examination
            </label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white"
            >
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Class Grade
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedExam && (
            <div className="text-right text-xs">
              <span className="text-slate-400">Duration: </span>
              <span className="font-mono text-slate-900 dark:text-white font-medium">
                {selectedExam.startDate} to {selectedExam.endDate}
              </span>
              <Badge variant={selectedExam.status === 'Published' ? 'success' : 'neutral'} className="ml-2">
                {selectedExam.status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Marks & Performance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Scholar Name</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Academic Status</th>
                <th className="py-3 px-4 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentMarks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No examination marks logged for this assessment yet.
                  </td>
                </tr>
              ) : (
                currentMarks.map(mark => {
                  const student = students.find(s => s.id === mark.studentId);
                  return (
                    <tr
                      key={mark.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {mark.studentName}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {mark.classGrade} · Section {mark.section}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {mark.subjectName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {mark.marksObtained}
                        </span>
                        <span className="text-slate-400 text-[11px]"> / {mark.maxMarks}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            mark.grade === 'A+'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : mark.grade === 'A'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {mark.grade}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            mark.remarks === 'Distinction' || mark.remarks === 'First Class'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {mark.remarks || 'Standard'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {student && (
                          <button
                            onClick={() => setReportCardStudent(student)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded flex items-center gap-1 ml-auto transition-colors"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Report Card</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marks Entry Modal */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Record Examination Marks"
        subtitle="Enters marks for grade calculation and transcript generation"
      >
        <form onSubmit={handleMarkSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Student Scholar
            </label>
            <select
              value={entryData.studentId}
              onChange={e => setEntryData({ ...entryData, studentId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {students.length === 0 ? (
                <option value="">No students enrolled yet</option>
              ) : (
                students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.classGrade} - {s.section})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              value={entryData.subjectName}
              onChange={e => setEntryData({ ...entryData, subjectName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Marks Obtained
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={entryData.marksObtained}
                onChange={e => setEntryData({ ...entryData, marksObtained: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Maximum Marks
              </label>
              <input
                type="number"
                value={entryData.maxMarks}
                onChange={e => setEntryData({ ...entryData, maxMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEntryModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!entryData.studentId}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg"
            >
              Record Score
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Report Card Modal */}
      {reportCardStudent && (
        <Modal
          isOpen={!!reportCardStudent}
          onClose={() => setReportCardStudent(null)}
          title={`Official Report Card Transcript: ${reportCardStudent.firstName} ${reportCardStudent.lastName}`}
          subtitle={`${selectedExam?.title || 'Academic Assessment'} · Academic Year 2026-27`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* The Printable Transcript Document */}
            <div className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg space-y-5 print:border-none print:shadow-none text-slate-900 dark:text-slate-100">
              {/* Institution Header */}
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex justify-center mb-2">
                  <StarAILogo size={54} />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  STAR AI ACADEMY
                </h3>
                <p className="text-[11px] text-slate-500">
                  Affiliated to Global Board of Secondary Education · Accredited Center of STEM & AI Excellence
                </p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  OFFICIAL ACADEMIC TRANSCRIPT & PROGRESS REPORT
                </div>
              </div>

              {/* Scholar Details Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Scholar Name</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {reportCardStudent.firstName} {reportCardStudent.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Registration No</span>
                  <p className="font-mono font-medium text-slate-900 dark:text-white mt-0.5">
                    {reportCardStudent.regNo}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Class & Section</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {reportCardStudent.classGrade} ({reportCardStudent.section})
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Attendance Rate</span>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {reportCardStudent.attendanceRate}%
                  </p>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Subject Curriculum</th>
                      <th className="py-2.5 px-3 text-center">Max Marks</th>
                      <th className="py-2.5 px-3 text-center">Marks Scored</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {getStudentMarks(reportCardStudent.id).map(m => (
                      <tr key={m.id}>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-white">
                          {m.subjectName}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500">{m.maxMarks}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {m.marksObtained}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                          {m.grade}
                        </td>
                        <td className="py-2 px-3 text-right font-sans text-[11px] text-slate-500">
                          {m.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 flex items-end justify-between text-xs text-slate-500">
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 pb-1 mb-1 font-signature text-sm text-slate-800 dark:text-slate-200">
                    S. Jenkins
                  </div>
                  <span className="text-[10px]">Class Teacher Signature</span>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/60 flex items-center justify-center text-[9px] font-bold text-amber-600 dark:text-amber-400 mx-auto mb-1 uppercase">
                    OFFICIAL SEAL
                  </div>
                  <span className="text-[10px]">Academic Dean</span>
                </div>

                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 pb-1 mb-1 font-signature text-sm text-slate-800 dark:text-slate-200">
                    Dr. E. Reed
                  </div>
                  <span className="text-[10px]">Principal's Signature</span>
                </div>
              </div>
            </div>

            {/* Print trigger button */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Transcript</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
