import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Upload,
  Eye,
  Trash2,
  CreditCard,
  UserPlus,
  Printer,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, AdmissionEnquiry } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { StarAILogo } from '../common/StarAILogo.tsx';
import { generateRegistrationNumber } from '../../utils/schoolMath.ts';

interface StudentManagementViewProps {
  students: Student[];
  enquiries?: AdmissionEnquiry[];
  onAddStudent: (student: Partial<Student>) => Promise<any>;
  onUpdateStudent: (id: string, updates: Partial<Student>) => Promise<any>;
  onDeleteStudent: (id: string) => Promise<any>;
  onBulkImport: (students: Partial<Student>[]) => Promise<any>;
  onMarkEnquiryAdmitted?: (enquiryId: string) => Promise<any>;
  onInspectStudent?: (student: Student) => void;
}

const SAMPLE_APPLICANTS = [
  {
    firstName: 'Aarav',
    lastName: 'Mehta',
    dateOfBirth: '2010-08-14',
    gender: 'Male' as const,
    classGrade: 'Grade 10',
    section: 'A',
    bloodGroup: 'O+',
    parentName: 'Rohan Mehta',
    parentPhone: '+1 (555) 704-2281',
    parentEmail: 'rohan.mehta@techventures.com',
    address: '310 Oakwood Terrace, North Wing',
    emergencyContact: '+1 (555) 704-2299',
  },
  {
    firstName: 'Isla',
    lastName: 'Thornton',
    dateOfBirth: '2011-03-27',
    gender: 'Female' as const,
    classGrade: 'Grade 9',
    section: 'A',
    bloodGroup: 'A+',
    parentName: 'Claire Thornton',
    parentPhone: '+1 (555) 812-4450',
    parentEmail: 'claire.thornton@designstudio.org',
    address: '85 Magnolia Crescent, West Oak',
    emergencyContact: '+1 (555) 812-4499',
  },
  {
    firstName: 'Dev',
    lastName: 'Kulkarni',
    dateOfBirth: '2009-11-09',
    gender: 'Male' as const,
    classGrade: 'Grade 11',
    section: 'A',
    bloodGroup: 'B+',
    parentName: 'Ananya Kulkarni',
    parentPhone: '+1 (555) 934-6610',
    parentEmail: 'ananya.k@biomed.io',
    address: '142 Horizon Ridge Boulevard',
    emergencyContact: '+1 (555) 934-6699',
  },
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '2010-05-15',
  gender: 'Male' as 'Male' | 'Female' | 'Other',
  classGrade: 'Grade 10',
  section: 'A',
  bloodGroup: 'O+',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  address: '',
  emergencyContact: '',
};

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  students,
  enquiries = [],
  onAddStudent,
  onDeleteStudent,
  onBulkImport,
  onMarkEnquiryAdmitted,
  onInspectStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeEnquiryId, setActiveEnquiryId] = useState<string | null>(null);
  const [sampleCursor, setSampleCursor] = useState(0);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showNotice = (type: 'success' | 'error', text: string) => {
    setBannerNotice({ type, text });
    setTimeout(() => setBannerNotice(null), 4500);
  };

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Newly Admitted Scholars (2026-11 intake) & Pending Enquiries
  const recentAdmissions = students.filter(s => s.admissionDate >= '2026-11-01').slice(0, 4);
  const pendingEnquiries = enquiries.filter(e => e.status === 'New' || e.status === 'Follow-up');

  // Filter logic
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      searchTerm === '' ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = selectedGrade === 'All' || s.classGrade === selectedGrade;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.parentName.trim()) errors.parentName = 'Parent name is required';
    if (!formData.parentPhone.trim()) errors.parentPhone = 'Parent phone is required';
    if (!formData.address.trim()) errors.address = 'Residential address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openBlankAdmissionModal = () => {
    setActiveEnquiryId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEnquiryAdmissionModal = (enq: AdmissionEnquiry) => {
    const parts = enq.studentName.trim().split(/\s+/);
    const firstName = parts[0] || enq.studentName;
    const lastName = parts.slice(1).join(' ') || 'Scholar';
    setActiveEnquiryId(enq.id);
    setFormData({
      ...EMPTY_FORM,
      firstName,
      lastName,
      classGrade: enq.gradeApplied || 'Grade 9',
      section: 'A',
      parentName: enq.parentName || '',
      parentPhone: enq.contactNumber || '',
      parentEmail: enq.email || '',
      address: 'New Intake Residence — Update Street Address',
      emergencyContact: enq.contactNumber || '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleQuickFillSample = () => {
    const sample = SAMPLE_APPLICANTS[sampleCursor % SAMPLE_APPLICANTS.length];
    setSampleCursor(c => c + 1);
    setFormData(sample);
    setFormErrors({});
  };

  const submitAdmission = async (openIdCardAfter: boolean) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const enrolledName = `${formData.firstName} ${formData.lastName}`;
      const result = await onAddStudent(formData);
      if (activeEnquiryId && onMarkEnquiryAdmitted) {
        await onMarkEnquiryAdmitted(activeEnquiryId);
      }
      setIsAddModalOpen(false);
      setActiveEnquiryId(null);
      setFormData(EMPTY_FORM);
      setFormErrors({});
      showNotice(
        'success',
        `Admitted ${enrolledName} (${result?.student?.regNo || 'new scholar'}) and generated tuition invoice.`
      );
      if (openIdCardAfter && result?.student) {
        setIdCardStudent(result.student);
      }
    } catch (err: any) {
      showNotice('error', `Error adding student: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitAdmission(false);
  };

  // Excel Export
  const handleExportExcel = () => {
    const exportData = filteredStudents.map(s => ({
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
      'Parent Email': s.parentEmail,
      'Address': s.address,
      'Attendance %': `${s.attendanceRate}%`,
      'Status': s.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `STAR_AI_Students_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Sample Bulk Import
  const handleSampleBulkImport = async () => {
    const demoBatch: Partial<Student>[] = [
      { firstName: 'Benjamin', lastName: 'Franklin', classGrade: 'Grade 11', section: 'A', gender: 'Male', parentName: 'Josiah Franklin', parentPhone: '+1 (555) 881-2290', address: '17 Milk Street', bloodGroup: 'O+' },
      { firstName: 'Marie', lastName: 'Curie', classGrade: 'Grade 12', section: 'A', gender: 'Female', parentName: 'Wladyslaw Sklodowski', parentPhone: '+1 (555) 881-2291', address: '16 Freta St', bloodGroup: 'AB+' },
      { firstName: 'Alan', lastName: 'Turing', classGrade: 'Grade 11', section: 'A', gender: 'Male', parentName: 'Julius Turing', parentPhone: '+1 (555) 881-2292', address: '2 Warrington Crescent', bloodGroup: 'A+' },
    ];
    await onBulkImport(demoBatch);
    showNotice('success', 'Successfully imported 3 scholars via batch ingestion.');
  };

  const previewRegNo = generateRegistrationNumber('STAR', 2026, students.length + 1);
  const previewFullName =
    formData.firstName.trim() || formData.lastName.trim()
      ? `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      : 'New Scholar Name';

  return (
    <div className="space-y-6">
      {bannerNotice && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{bannerNotice.text}</span>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
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
            Student Management & Admissions
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span>{students.length} Total Scholars</span>
            {recentAdmissions.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {recentAdmissions.length} Newly Admitted
                </span>
              </>
            )}
            {pendingEnquiries.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{pendingEnquiries.length} Enquiries Ready</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleSampleBulkImport}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={openBlankAdmissionModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* Attractive New Admissions Spotlight & Enquiry Desk (shown when new admissions or enquiries exist) */}
      {(recentAdmissions.length > 0 || pendingEnquiries.length > 0) && (
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="px-5 py-4 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StarAILogo size={40} className="shrink-0" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                AY 2026–2027 New Admissions Showcase
              </h3>
              <p className="text-[11px] text-blue-200/90">
                Recent scholar enrollments with automatic tuition setup and instant ID credentials
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openBlankAdmissionModal}
            className="px-3.5 py-2 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll New Student</span>
          </button>
        </div>

        {/* Newly Admitted Students Row */}
        {recentAdmissions.length > 0 && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100 dark:border-slate-800">
            {recentAdmissions.map(student => (
              <div
                key={student.id}
                className="flex flex-col justify-between gap-3 pb-3 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r last:border-b-0 last:border-r-0 border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        onInspectStudent ? onInspectStudent(student) : setSelectedStudent(student)
                      }
                      className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left"
                    >
                      {student.firstName} {student.lastName}
                    </button>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {student.classGrade} · Sec {student.section} · {student.rollNo}
                    </p>
                    <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                      {student.regNo} · Admitted {student.admissionDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() =>
                      onInspectStudent ? onInspectStudent(student) : setSelectedStudent(student)
                    }
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Dossier</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setIdCardStudent(student)}
                    className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>ID Card</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Enquiries Ready for 1-Click Admission */}
        {pendingEnquiries.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Incoming Admission Enquiries Ready to Enroll</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Click Admit Scholar to pre-fill enrollment form
              </span>
            </div>

            <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {pendingEnquiries.map(enq => (
                <div
                  key={enq.id}
                  className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {enq.studentName}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {enq.gradeApplied}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Guardian: {enq.parentName} ({enq.contactNumber})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {enq.notes}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEnquiryAdmissionModal(enq)}
                    className="px-3 py-1.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1 shrink-0 self-start sm:self-auto transition-colors"
                  >
                    <span>Admit Scholar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by student name, registration number, or roll ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="All">All Grades</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Transferred">Transferred</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Students Data Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Reg & Roll No</th>
                <th className="py-3 px-4">Grade & Section</th>
                <th className="py-3 px-4">Parent / Contact</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-slate-500">
                    {students.length === 0 ? (
                      <div className="space-y-2.5">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          No students added yet. Enroll your first student to build your campus directory.
                        </p>
                        <button
                          type="button"
                          onClick={openBlankAdmissionModal}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Enroll First Student</span>
                        </button>
                      </div>
                    ) : (
                      'No student records matching current filters.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              onInspectStudent ? onInspectStudent(student) : setSelectedStudent(student)
                            }
                            className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left"
                          >
                            {student.firstName} {student.lastName}
                          </button>
                          <p className="text-[10px] text-slate-400">
                            DOB: {student.dateOfBirth} · {student.bloodGroup}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-mono text-slate-900 dark:text-slate-200 font-medium">
                        {student.regNo}
                      </p>
                      <p className="text-[11px] text-slate-500">Roll: {student.rollNo}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {student.classGrade}
                      </span>
                      <span className="text-slate-500 ml-1">({student.section})</span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-900 dark:text-slate-200 font-medium">{student.parentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{student.parentPhone}</p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-semibold font-mono text-slate-900 dark:text-white">
                          {student.attendanceRate}%
                        </span>
                        {student.attendanceRate < 75 && (
                          <Badge variant="danger">Chronic Low</Badge>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          student.status === 'Active'
                            ? 'success'
                            : student.status === 'Transferred'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {student.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            onInspectStudent ? onInspectStudent(student) : setSelectedStudent(student)
                          }
                          title="View Complete Student Information"
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIdCardStudent(student)}
                          title="Generate Student ID Card"
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === student.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteStudent(student.id);
                                setConfirmDeleteId(null);
                                showNotice('success', `Removed ${student.firstName} ${student.lastName}.`);
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
                            onClick={() => setConfirmDeleteId(student.id)}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attractive New Student Admission Enrollment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Student Admission Enrollment"
        subtitle="Enrolls scholar in STAR AI, assigns roll number, and initializes tuition ledger."
        maxWidth="2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Live Credential Preview & Quick-Fill Strip */}
          <div className="p-4 rounded-xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StarAILogo size={44} className="shrink-0" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  Live Credential Preview · {previewRegNo}
                </p>
                <h4 className="text-sm font-bold text-white mt-0.5">{previewFullName}</h4>
                <p className="text-[11px] text-blue-200">
                  {formData.classGrade} · Section {formData.section} · Blood {formData.bloodGroup}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickFillSample}
              className="px-3 py-1.5 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick-Fill Sample Applicant</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Aarav"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              {formErrors.firstName && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Mehta"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              {formErrors.lastName && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Class Grade Allocation *
              </label>
              <select
                value={formData.classGrade}
                onChange={e => setFormData({ ...formData, classGrade: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <select
                value={formData.section}
                onChange={e => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Parent / Guardian Full Name *
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="e.g. Rohan Mehta"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              {formErrors.parentName && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.parentName}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Parent Phone *
              </label>
              <input
                type="tel"
                value={formData.parentPhone}
                onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              {formErrors.parentPhone && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.parentPhone}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Parent Email
              </label>
              <input
                type="email"
                value={formData.parentEmail}
                onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+1 (555) 000-9999"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Residential Address *
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full residential street address..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              {formErrors.address && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.address}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submitAdmission(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Enrolling...' : 'Admit & Generate ID Card'}</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
            >
              {isSubmitting ? 'Enrolling...' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Fallback Student Profile Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student Profile: ${selectedStudent.firstName} ${selectedStudent.lastName}`}
          subtitle={`Registration ID: ${selectedStudent.regNo}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shrink-0">
                {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h4>
                  <Badge variant="success">{selectedStudent.status}</Badge>
                </div>
                <p className="text-slate-500 mt-0.5">
                  {selectedStudent.classGrade} · Section {selectedStudent.section} · Roll: {selectedStudent.rollNo}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <span>Attendance: {selectedStudent.attendanceRate}%</span>
                  <span>·</span>
                  <span>Blood Group: {selectedStudent.bloodGroup}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-[10px] uppercase font-semibold">Guardian Information</p>
                <p className="font-medium text-slate-900 dark:text-white mt-1">{selectedStudent.parentName}</p>
                <p className="text-slate-500 font-mono mt-0.5">{selectedStudent.parentPhone}</p>
                <p className="text-slate-500 truncate mt-0.5">{selectedStudent.parentEmail}</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-[10px] uppercase font-semibold">Residential Details</p>
                <p className="font-medium text-slate-900 dark:text-white mt-1">{selectedStudent.address}</p>
                <p className="text-slate-500 mt-1">Admission: {selectedStudent.admissionDate}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const student = selectedStudent;
                  setSelectedStudent(null);
                  setIdCardStudent(student);
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Print Student ID Card</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Student ID Card Generation & Printable Modal */}
      {idCardStudent && (
        <Modal
          isOpen={!!idCardStudent}
          onClose={() => setIdCardStudent(null)}
          title="STAR AI Student Identity Card"
          subtitle="Official institutional credential with barcode & verification"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl border-2 border-amber-400 bg-linear-to-b from-slate-900 via-blue-950 to-slate-950 text-white p-5 relative">
              <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <StarAILogo size={40} className="shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs tracking-wider uppercase text-amber-300">
                      STAR AI ACADEMY
                    </h5>
                    <p className="text-[9px] text-blue-200">Institutional Scholar Credential</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                  AY 2026-27
                </span>
              </div>

              <div className="flex gap-4 py-4 items-center">
                <div className="w-20 h-24 rounded-lg bg-slate-800 border-2 border-amber-400/80 overflow-hidden flex items-center justify-center font-bold text-2xl text-amber-300 shrink-0">
                  {idCardStudent.firstName.charAt(0)}{idCardStudent.lastName.charAt(0)}
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-sm text-white">
                    {idCardStudent.firstName} {idCardStudent.lastName}
                  </h4>
                  <p className="text-amber-300 font-mono font-medium">{idCardStudent.regNo}</p>
                  <p className="text-slate-300">{idCardStudent.classGrade} · Sec {idCardStudent.section}</p>
                  <p className="text-slate-400 text-[10px]">Blood Group: {idCardStudent.bloodGroup}</p>
                  <p className="text-slate-400 text-[10px]">Parent: {idCardStudent.parentPhone}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-blue-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <div>
                  <div className="h-6 w-32 bg-white rounded-xs flex items-center justify-center p-0.5">
                    <div className="w-full h-full flex justify-between items-stretch">
                      {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7].map((w, idx) => (
                        <div key={idx} className="bg-black" style={{ width: `${w}px` }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-slate-400 mt-0.5 block">
                    {idCardStudent.regNo}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-amber-400 block font-semibold">PRINCIPAL SIGNATURE</span>
                  <span className="text-[8px] text-slate-400">STAR Verified</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Identity Card</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
