import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SchoolDatabase } from '../../types/school.ts';
import { formatCurrency, calculateFeeSummary } from '../../utils/schoolMath.ts';

interface ReportsExportViewProps {
  db: SchoolDatabase;
}

export const ReportsExportView: React.FC<ReportsExportViewProps> = ({ db }) => {
  const [selectedReport, setSelectedReport] = useState<
    'students' | 'attendance' | 'fees' | 'exams' | 'staff'
  >('students');
  const [selectedYear, setSelectedYear] = useState('2026-2027');

  const feeSummary = calculateFeeSummary(db.invoices);

  // Excel Export Handler using XLSX library
  const handleExportExcel = () => {
    let sheetData: any[] = [];
    let sheetName = 'Report';

    if (selectedReport === 'students') {
      sheetName = 'Students_Roster';
      sheetData = db.students.map(s => ({
        'Registration No': s.regNo,
        'Roll No': s.rollNo,
        'Full Name': `${s.firstName} ${s.lastName}`,
        'Grade': s.classGrade,
        'Section': s.section,
        'Gender': s.gender,
        'DOB': s.dateOfBirth,
        'Blood Group': s.bloodGroup,
        'Parent Name': s.parentName,
        'Parent Phone': s.parentPhone,
        'Attendance Rate': `${s.attendanceRate}%`,
        'Status': s.status,
      }));
    } else if (selectedReport === 'attendance') {
      sheetName = 'Daily_Attendance';
      sheetData = db.attendance.map(a => ({
        'Date': a.date,
        'Student ID': a.studentId,
        'Student Name': a.studentName,
        'Grade': a.classGrade,
        'Section': a.section,
        'Status': a.status,
        'Remarks': a.remarks || 'None',
      }));
    } else if (selectedReport === 'fees') {
      sheetName = 'Fee_Collection_Ledger';
      sheetData = db.invoices.map(i => ({
        'Invoice No': i.invoiceNo,
        'Student Name': i.studentName,
        'Class': `${i.classGrade} (${i.section})`,
        'Fee Category': i.feeType,
        'Amount ($)': i.amount,
        'Paid Amount ($)': i.paidAmount,
        'Balance Due ($)': i.amount - i.paidAmount,
        'Due Date': i.dueDate,
        'Status': i.status,
      }));
    } else if (selectedReport === 'exams') {
      sheetName = 'Academic_Examination_Marks';
      sheetData = db.marks.map(m => ({
        'Exam ID': m.examId,
        'Student Name': m.studentName,
        'Class': `${m.classGrade} (${m.section})`,
        'Subject': m.subjectName,
        'Marks Scored': m.marksObtained,
        'Max Marks': m.maxMarks,
        'Grade': m.grade,
        'Academic Evaluation': m.remarks || 'Standard',
      }));
    } else if (selectedReport === 'staff') {
      sheetName = 'Faculty_Staff_Directory';
      sheetData = db.teachers.map(t => ({
        'Employee ID': t.employeeId,
        'Faculty Name': `${t.firstName} ${t.lastName}`,
        'Department': t.department,
        'Designation': t.designation,
        'Qualification': t.qualification,
        'Experience (Years)': t.experienceYears,
        'Monthly Salary ($)': t.salaryMonthly,
        'Status': t.status,
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `STAR_AI_${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Comprehensive Institutional Reports & Data Export Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export official spreadsheets (.xlsx) or generate printable PDF transcripts for accreditation audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report View</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Report Categories Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'students', label: 'Scholar Directory', count: db.students.length },
          { id: 'attendance', label: 'Daily Attendance', count: db.attendance.length },
          { id: 'fees', label: 'Fee Invoices & Dues', count: db.invoices.length },
          { id: 'exams', label: 'Examination Marks', count: db.marks.length },
          { id: 'staff', label: 'Faculty Directory', count: db.teachers.length },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setSelectedReport(item.id as any)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedReport === item.id
                ? 'bg-blue-50/70 dark:bg-blue-950/60 border-blue-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {item.label}
            </span>
            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
              {item.count} Records
            </span>
          </button>
        ))}
      </div>

      {/* Preview Table */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              Live Preview: {selectedReport} Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Generated from real-time database schema · Academic Year {selectedYear}
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Export Format: <strong className="text-emerald-600 dark:text-emerald-400">Microsoft Excel (.xlsx)</strong>
          </div>
        </div>

        {/* Dynamic preview content */}
        <div className="overflow-x-auto max-h-96">
          {selectedReport === 'students' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2 px-3">Reg No</th>
                  <th className="py-2 px-3">Scholar Name</th>
                  <th className="py-2 px-3">Grade</th>
                  <th className="py-2 px-3">Parent Name</th>
                  <th className="py-2 px-3">Attendance</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {db.students.map(s => (
                  <tr key={s.id}>
                    <td className="py-2 px-3 font-mono">{s.regNo}</td>
                    <td className="py-2 px-3 font-semibold">{s.firstName} {s.lastName}</td>
                    <td className="py-2 px-3">{s.classGrade} ({s.section})</td>
                    <td className="py-2 px-3">{s.parentName}</td>
                    <td className="py-2 px-3 font-mono">{s.attendanceRate}%</td>
                    <td className="py-2 px-3 text-right">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'fees' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2 px-3">Invoice No</th>
                  <th className="py-2 px-3">Scholar</th>
                  <th className="py-2 px-3">Fee Type</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Paid</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {db.invoices.map(i => (
                  <tr key={i.id}>
                    <td className="py-2 px-3">{i.invoiceNo}</td>
                    <td className="py-2 px-3 font-sans font-semibold">{i.studentName}</td>
                    <td className="py-2 px-3 font-sans">{i.feeType}</td>
                    <td className="py-2 px-3 font-bold">{formatCurrency(i.amount)}</td>
                    <td className="py-2 px-3 text-emerald-600">{formatCurrency(i.paidAmount)}</td>
                    <td className="py-2 px-3 text-right font-sans">{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'exams' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2 px-3">Scholar</th>
                  <th className="py-2 px-3">Class</th>
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Score</th>
                  <th className="py-2 px-3">Grade</th>
                  <th className="py-2 px-3 text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {db.marks.map(m => (
                  <tr key={m.id}>
                    <td className="py-2 px-3 font-sans font-semibold">{m.studentName}</td>
                    <td className="py-2 px-3 font-sans">{m.classGrade} ({m.section})</td>
                    <td className="py-2 px-3 font-sans">{m.subjectName}</td>
                    <td className="py-2 px-3 font-bold">{m.marksObtained} / {m.maxMarks}</td>
                    <td className="py-2 px-3 text-blue-600 font-bold">{m.grade}</td>
                    <td className="py-2 px-3 text-right font-sans">{m.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'staff' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2 px-3">Employee ID</th>
                  <th className="py-2 px-3">Faculty Name</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Designation</th>
                  <th className="py-2 px-3">Salary</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {db.teachers.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 px-3 font-mono">{t.employeeId}</td>
                    <td className="py-2 px-3 font-semibold">{t.firstName} {t.lastName}</td>
                    <td className="py-2 px-3">{t.department}</td>
                    <td className="py-2 px-3">{t.designation}</td>
                    <td className="py-2 px-3 font-mono font-bold">{formatCurrency(t.salaryMonthly)}</td>
                    <td className="py-2 px-3 text-right">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'attendance' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Scholar Name</th>
                  <th className="py-2 px-3">Grade</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {db.attendance.map(a => (
                  <tr key={a.id}>
                    <td className="py-2 px-3 font-mono">{a.date}</td>
                    <td className="py-2 px-3 font-semibold">{a.studentName}</td>
                    <td className="py-2 px-3">{a.classGrade} ({a.section})</td>
                    <td className="py-2 px-3 font-bold">{a.status}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{a.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
