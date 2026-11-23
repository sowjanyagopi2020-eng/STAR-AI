import React, { useState } from 'react';
import {
  Plus,
  Search,
  UserPlus,
  Mail,
  Briefcase,
  Award,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  Clock,
} from 'lucide-react';
import { Teacher, TeacherApplicant } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { StarAILogo } from '../common/StarAILogo.tsx';
import { formatCurrency } from '../../utils/schoolMath.ts';

interface StaffManagementViewProps {
  teachers: Teacher[];
  teacherApplicants?: TeacherApplicant[];
  onAddTeacher: (teacher: Partial<Teacher>) => Promise<any>;
  onDeleteTeacher: (id: string) => Promise<any>;
  onAddApplicant?: (applicant: Partial<TeacherApplicant>) => Promise<any>;
  onUpdateApplicantStatus?: (
    id: string,
    status: TeacherApplicant['interviewStatus']
  ) => Promise<any>;
  onScheduleInterview?: (
    id: string,
    slot: {
      interviewDate: string;
      interviewTime: string;
      interviewerName: string;
      interviewVenue: string;
      notes?: string;
    }
  ) => Promise<any>;
  onHireApplicant?: (id: string) => Promise<any>;
}

const SAMPLE_CANDIDATES = [
  {
    firstName: 'Arjun',
    lastName: 'Verma',
    email: 'arjun.verma@stemfaculty.org',
    phone: '+1 (555) 412-9088',
    department: 'Mathematics',
    desiredDesignation: 'Mathematics Olympiad Coach',
    qualification: 'M.Sc. Applied Mathematics, B.Ed.',
    experienceYears: 7,
    subjects: 'Calculus, Combinatorics, Statistics',
    expectedSalaryMonthly: 5900,
    availableFrom: 'Immediate',
    notes: 'Coached national math finalists; ready for Term II senior classes.',
  },
  {
    firstName: 'Claire',
    lastName: 'Beaumont',
    email: 'claire.beaumont@bilingualed.org',
    phone: '+1 (555) 418-3340',
    department: 'Biology',
    desiredDesignation: 'Senior Biology & Genetics Teacher',
    qualification: 'M.Sc. Molecular Biology, PGCE',
    experienceYears: 6,
    subjects: 'Genetics, Microbiology, AP Biology',
    expectedSalaryMonthly: 5800,
    availableFrom: '2026-12-01',
    notes: 'Extensive lab curriculum design experience for Grades 10-12.',
  },
];

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  teachers,
  teacherApplicants = [],
  onAddTeacher,
  onDeleteTeacher,
  onAddApplicant,
  onUpdateApplicantStatus,
  onScheduleInterview,
  onHireApplicant,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [applicantStatusFilter, setApplicantStatusFilter] = useState<string>('AllWaiting');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
  const [interviewTarget, setInterviewTarget] = useState<TeacherApplicant | null>(null);
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [hiringId, setHiringId] = useState<string | null>(null);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const [interviewForm, setInterviewForm] = useState({
    interviewDate: '2026-11-21',
    interviewTime: '10:30 AM',
    interviewerName: 'Dr. Evelyn Reed (Principal)',
    interviewVenue: 'Executive Conference Room A',
    notes: '',
  });

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4500);
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: 'Faculty Instructor',
    department: 'Mathematics',
    qualification: 'M.Sc., B.Ed.',
    experienceYears: 6,
    joiningDate: '2026-11-17',
    subjectsTaught: 'Advanced Mathematics',
    salaryMonthly: 5800,
  });

  const [applicantForm, setApplicantForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Mathematics',
    desiredDesignation: 'Subject Teacher',
    qualification: 'M.Sc., B.Ed.',
    experienceYears: 5,
    subjects: 'Mathematics, Statistics',
    expectedSalaryMonthly: 5600,
    availableFrom: 'Immediate',
    notes: '',
  });

  const waitingApplicants = teacherApplicants.filter(
    a => a.interviewStatus !== 'Hired' && a.interviewStatus !== 'Declined'
  );
  const newlyJoinedTeachers = teachers.filter(t => t.joiningDate >= '2026-11-01');

  const filteredApplicants = teacherApplicants.filter(a => {
    const matchesSearch =
      searchTerm === '' ||
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subjects.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.applicantCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (applicantStatusFilter === 'AllWaiting') {
      return a.interviewStatus !== 'Hired' && a.interviewStatus !== 'Declined';
    }
    return a.interviewStatus === applicantStatusFilter;
  });

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      searchTerm === '' ||
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'All' || t.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(teachers.map(t => t.department)));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Please enter faculty first and last name.');
      return;
    }
    setFormError(null);

    await onAddTeacher({
      ...formData,
      subjectsTaught: formData.subjectsTaught
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    });
    showNotice(`Added ${formData.firstName} ${formData.lastName} to Active Faculty Directory.`);
    setIsAddModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      designation: 'Faculty Instructor',
      department: 'Mathematics',
      qualification: 'M.Sc., B.Ed.',
      experienceYears: 6,
      joiningDate: '2026-11-17',
      subjectsTaught: 'Advanced Mathematics',
      salaryMonthly: 5800,
    });
  };

  const handleApplicantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantForm.firstName.trim() || !applicantForm.lastName.trim()) {
      return;
    }
    if (onAddApplicant) {
      await onAddApplicant({
        ...applicantForm,
        subjects: applicantForm.subjects
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      });
      showNotice(
        `Added ${applicantForm.firstName} ${applicantForm.lastName} to the Teacher Job Waiting List.`
      );
    }
    setIsApplicantModalOpen(false);
    setApplicantForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'Mathematics',
      desiredDesignation: 'Subject Teacher',
      qualification: 'M.Sc., B.Ed.',
      experienceYears: 5,
      subjects: 'Mathematics, Statistics',
      expectedSalaryMonthly: 5600,
      availableFrom: 'Immediate',
      notes: '',
    });
  };

  const handleHireClick = async (applicant: TeacherApplicant) => {
    if (!onHireApplicant) return;
    setHiringId(applicant.id);
    try {
      await onHireApplicant(applicant.id);
      showNotice(
        `Hired ${applicant.firstName} ${applicant.lastName} into ${applicant.department}.`
      );
    } finally {
      setHiringId(null);
    }
  };

  const openScheduleInterviewModal = (applicant: TeacherApplicant) => {
    setInterviewTarget(applicant);
    setInterviewError(null);
    setInterviewForm({
      interviewDate: applicant.interviewDate || '2026-11-21',
      interviewTime: applicant.interviewTime || '10:30 AM',
      interviewerName: applicant.interviewerName || 'Dr. Evelyn Reed (Principal)',
      interviewVenue: applicant.interviewVenue || 'Executive Conference Room A',
      notes: applicant.notes || '',
    });
  };

  const handleScheduleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewTarget) return;
    if (!interviewForm.interviewDate || !interviewForm.interviewTime.trim()) {
      setInterviewError('Please choose both an interview date and time slot.');
      return;
    }
    setInterviewError(null);
    setIsSchedulingInterview(true);
    try {
      if (onScheduleInterview) {
        await onScheduleInterview(interviewTarget.id, interviewForm);
      } else if (onUpdateApplicantStatus) {
        await onUpdateApplicantStatus(interviewTarget.id, 'Interview Scheduled');
      }
      showNotice(
        `Interview booked for ${interviewTarget.firstName} ${interviewTarget.lastName} on ${interviewForm.interviewDate} at ${interviewForm.interviewTime}.`
      );
      setInterviewTarget(null);
    } catch (err: any) {
      setInterviewError(err?.message || 'Unable to book interview slot.');
    } finally {
      setIsSchedulingInterview(false);
    }
  };

  const getApplicantBadgeVariant = (status: TeacherApplicant['interviewStatus']) => {
    switch (status) {
      case 'Shortlisted':
        return 'primary' as const;
      case 'Interview Scheduled':
        return 'warning' as const;
      case 'Hired':
        return 'success' as const;
      case 'Declined':
        return 'danger' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[11px] underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Faculty Directory & Teacher Hiring Queue
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span>{teachers.length} Active Faculty</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {newlyJoinedTeachers.length} Joined Nov 2026
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {waitingApplicants.length} Teachers Waiting for Job
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsApplicantModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-slate-900" />
            <span className="text-slate-950">Add Waiting Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Active Faculty</span>
          </button>
        </div>
      </div>

      {/* Teachers Waiting for a Teaching Job (Recruitment Waitlist) */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="px-5 py-4 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StarAILogo size={40} className="shrink-0" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Teachers Waiting for Teaching Positions
              </h3>
              <p className="text-[11px] text-blue-200/90">
                Vetted teaching candidates ready for AY 2026–2027 faculty expansion — shortlist, schedule demo lectures, or hire in 1 click
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {[
              { id: 'AllWaiting', label: `Waiting (${waitingApplicants.length})` },
              { id: 'Shortlisted', label: 'Shortlisted' },
              { id: 'Interview Scheduled', label: 'Interview Scheduled' },
              { id: 'Waiting for Review', label: 'New Review' },
              { id: 'Hired', label: 'Hired' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setApplicantStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  applicantStatusFilter === tab.id
                    ? 'bg-amber-400 text-slate-950 font-semibold'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Waiting List */}
        {filteredApplicants.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No teacher candidates match the current filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredApplicants.map(candidate => (
              <div
                key={candidate.id}
                className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {candidate.firstName} {candidate.lastName}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {candidate.applicantCode}
                      </span>
                      <Badge variant={getApplicantBadgeVariant(candidate.interviewStatus)}>
                        {candidate.interviewStatus}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        {candidate.department}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                      <span>{candidate.desiredDesignation}</span>
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                      <span>{candidate.qualification}</span>
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                      <span className="font-medium">{candidate.experienceYears} yrs exp</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        Subjects: <strong className="text-slate-700 dark:text-slate-200">{candidate.subjects.join(', ')}</strong>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Available: {candidate.availableFrom}</span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                      <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                        Expected: {formatCurrency(candidate.expectedSalaryMonthly)}/mo
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3" />
                        <span>{candidate.email}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" />
                        <span>{candidate.phone}</span>
                      </span>
                      {candidate.notes && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                          <span className="italic">{candidate.notes}</span>
                        </>
                      )}
                    </div>

                    {candidate.interviewDate && candidate.interviewTime && (
                      <div className="pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Booked Slot: {candidate.interviewDate} at {candidate.interviewTime}
                          </span>
                        </span>
                        {candidate.interviewerName && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                            <span>Panel: {candidate.interviewerName}</span>
                          </>
                        )}
                        {candidate.interviewVenue && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                            <span>{candidate.interviewVenue}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {candidate.interviewStatus !== 'Hired' && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {candidate.interviewStatus !== 'Shortlisted' && onUpdateApplicantStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateApplicantStatus(candidate.id, 'Shortlisted')}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
                      >
                        Shortlist
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openScheduleInterviewModal(candidate)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Schedule Interview</span>
                    </button>

                    <button
                      type="button"
                      disabled={hiringId === candidate.id}
                      onClick={() => handleHireClick(candidate)}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{hiringId === candidate.id ? 'Hiring...' : 'Hire Teacher'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search faculty or waiting teacher candidates by name, subject, ID, or department..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
        >
          <option value="All">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Active Faculty Directory Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Active School Faculty ({filteredTeachers.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Includes {newlyJoinedTeachers.length} new Term II hires
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map(teacher => {
            const isRecentHire = teacher.joiningDate >= '2026-11-01';
            return (
              <div
                key={teacher.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
                        {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {teacher.firstName} {teacher.lastName}
                        </h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                          {teacher.designation}
                        </p>
                      </div>
                    </div>
                    <Badge variant={teacher.status === 'Active' ? 'success' : 'neutral'}>
                      {teacher.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Dept: <strong className="text-slate-900 dark:text-white">{teacher.department}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {teacher.qualification} · {teacher.experienceYears} yrs exp
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                  </div>

                  {/* Subjects clean typography line */}
                  <p className="mt-3 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Subjects:</span> {teacher.subjectsTaught.join(' · ')}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[11px]">{teacher.employeeId}</span>
                    {isRecentHire && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        New Joiner ({teacher.joiningDate})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(teacher.salaryMonthly)}/mo
                    </span>
                    {confirmDeleteId === teacher.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTeacher(teacher.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(teacher.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove Faculty Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Teacher Job Applicant Modal */}
      <Modal
        isOpen={isApplicantModalOpen}
        onClose={() => setIsApplicantModalOpen(false)}
        title="Add Teacher Job Applicant"
        subtitle="Logs a candidate waiting for a teaching position at STAR AI Academy"
        maxWidth="lg"
      >
        <form onSubmit={handleApplicantSubmit} className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
                Recruitment Waitlist Intake
              </p>
              <p className="text-xs text-blue-100 mt-0.5">
                Quickly pre-fill a vetted educator profile or enter custom credentials
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const sample = SAMPLE_CANDIDATES[sampleIndex % SAMPLE_CANDIDATES.length];
                setSampleIndex(i => i + 1);
                setApplicantForm(sample);
              }}
              className="px-3 py-1.5 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg flex items-center gap-1 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick-Fill Candidate</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={applicantForm.firstName}
                onChange={e => setApplicantForm({ ...applicantForm, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={applicantForm.lastName}
                onChange={e => setApplicantForm({ ...applicantForm, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department Needed *
              </label>
              <input
                type="text"
                required
                value={applicantForm.department}
                onChange={e => setApplicantForm({ ...applicantForm, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Desired Role
              </label>
              <input
                type="text"
                value={applicantForm.desiredDesignation}
                onChange={e =>
                  setApplicantForm({ ...applicantForm, desiredDesignation: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={applicantForm.email}
                onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={applicantForm.phone}
                onChange={e => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Qualification
              </label>
              <input
                type="text"
                value={applicantForm.qualification}
                onChange={e =>
                  setApplicantForm({ ...applicantForm, qualification: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                value={applicantForm.experienceYears}
                onChange={e =>
                  setApplicantForm({
                    ...applicantForm,
                    experienceYears: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Available From
              </label>
              <input
                type="text"
                value={applicantForm.availableFrom}
                onChange={e =>
                  setApplicantForm({ ...applicantForm, availableFrom: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Expected Salary ($/mo)
              </label>
              <input
                type="number"
                value={applicantForm.expectedSalaryMonthly}
                onChange={e =>
                  setApplicantForm({
                    ...applicantForm,
                    expectedSalaryMonthly: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subjects (comma-separated)
            </label>
            <input
              type="text"
              value={applicantForm.subjects}
              onChange={e => setApplicantForm({ ...applicantForm, subjects: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Interview / HR Notes
            </label>
            <textarea
              rows={2}
              value={applicantForm.notes}
              onChange={e => setApplicantForm({ ...applicantForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApplicantModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              Add to Waiting List
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Active Faculty Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Faculty Member"
        subtitle="Onboards new active instructor directly into the academic registry"
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="faculty@starai.edu"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Physics"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monthly Salary ($)
              </label>
              <input
                type="number"
                value={formData.salaryMonthly}
                onChange={e => setFormData({ ...formData, salaryMonthly: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subjects Taught (comma-separated)
            </label>
            <input
              type="text"
              value={formData.subjectsTaught}
              onChange={e => setFormData({ ...formData, subjectsTaught: e.target.value })}
              placeholder="e.g. Astrophysics, Mechanics"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              Save Faculty Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Teacher Interview Slot Modal */}
      <Modal
        isOpen={!!interviewTarget}
        onClose={() => setInterviewTarget(null)}
        title="Schedule Teacher Interview"
        subtitle={
          interviewTarget
            ? `Book live panel or demo teaching slot for ${interviewTarget.firstName} ${interviewTarget.lastName} (${interviewTarget.applicantCode})`
            : ''
        }
        maxWidth="lg"
      >
        {interviewTarget && (
          <form onSubmit={handleScheduleInterviewSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  {interviewTarget.applicantCode} · {interviewTarget.department}
                </p>
                <p className="text-sm font-bold mt-0.5">
                  {interviewTarget.firstName} {interviewTarget.lastName}
                </p>
                <p className="text-[11px] text-blue-200">
                  {interviewTarget.desiredDesignation} · {interviewTarget.qualification}
                </p>
              </div>
              <Badge variant={getApplicantBadgeVariant(interviewTarget.interviewStatus)}>
                {interviewTarget.interviewStatus}
              </Badge>
            </div>

            {interviewError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                {interviewError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Interview Date *
                </label>
                <input
                  type="date"
                  required
                  value={interviewForm.interviewDate}
                  onChange={e =>
                    setInterviewForm({ ...interviewForm, interviewDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Interview Time Slot *
                </label>
                <input
                  type="text"
                  required
                  value={interviewForm.interviewTime}
                  onChange={e =>
                    setInterviewForm({ ...interviewForm, interviewTime: e.target.value })
                  }
                  placeholder="e.g. 10:30 AM"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Quick Time Slots
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM'].map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setInterviewForm({ ...interviewForm, interviewTime: slot })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      interviewForm.interviewTime === slot
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Interviewer / Hiring Panel
                </label>
                <select
                  value={interviewForm.interviewerName}
                  onChange={e =>
                    setInterviewForm({ ...interviewForm, interviewerName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Dr. Evelyn Reed (Principal)">Dr. Evelyn Reed (Principal)</option>
                  <option value="Dr. Harrison Wells (Vice Principal)">
                    Dr. Harrison Wells (Vice Principal)
                  </option>
                  <option value="Victoria Bennett (HR Manager)">Victoria Bennett (HR Manager)</option>
                  <option value="Prof. Sarah Jenkins (Dept Chair)">
                    Prof. Sarah Jenkins (Dept Chair)
                  </option>
                  <option value="Dr. David Chen (STEM Lead)">Dr. David Chen (STEM Lead)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Interview Room / Mode
                </label>
                <select
                  value={interviewForm.interviewVenue}
                  onChange={e =>
                    setInterviewForm({ ...interviewForm, interviewVenue: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Executive Conference Room A">Executive Conference Room A</option>
                  <option value="STEM Demo Classroom 204">STEM Demo Classroom 204</option>
                  <option value="Faculty Review Boardroom">Faculty Review Boardroom</option>
                  <option value="Online Video Interview">Online Video Interview</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Interview Notes / Demo Lesson Topic
              </label>
              <textarea
                rows={2}
                value={interviewForm.notes}
                onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                placeholder="e.g. 20-min demo lecture on selected subject followed by HR Q&A..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInterviewTarget(null)}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSchedulingInterview}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isSchedulingInterview ? 'Booking Slot...' : 'Confirm Interview Slot'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
