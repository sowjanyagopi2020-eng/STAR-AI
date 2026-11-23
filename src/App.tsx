import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, NavTab } from './components/layout/Sidebar.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { StudentManagementView } from './components/views/StudentManagementView.tsx';
import { StaffManagementView } from './components/views/StaffManagementView.tsx';
import { AttendanceView } from './components/views/AttendanceView.tsx';
import { AcademicsView } from './components/views/AcademicsView.tsx';
import { ExaminationsView } from './components/views/ExaminationsView.tsx';
import { FeesFinanceView } from './components/views/FeesFinanceView.tsx';
import { ParentPortalView } from './components/views/ParentPortalView.tsx';
import { StudentPortalView } from './components/views/StudentPortalView.tsx';
import { TransportView } from './components/views/TransportView.tsx';
import { LibraryView } from './components/views/LibraryView.tsx';
import { HostelView } from './components/views/HostelView.tsx';
import { CommunicationView } from './components/views/CommunicationView.tsx';
import { AIIntelligenceCenterView } from './components/views/AIIntelligenceCenterView.tsx';
import { PublicWebsiteView } from './components/views/PublicWebsiteView.tsx';
import { CertificatesAndVisitorsView } from './components/views/CertificatesAndVisitorsView.tsx';
import { ReportsExportView } from './components/views/ReportsExportView.tsx';
import { OpenScreenView } from './components/views/OpenScreenView.tsx';
import { CheckCircle2, AlertCircle, X, RotateCcw } from 'lucide-react';
import { QuickAskDrawer } from './components/common/QuickAskDrawer.tsx';
import { StudentDossierModal } from './components/common/StudentDossierModal.tsx';
import { Modal } from './components/common/Modal.tsx';
import { DEMO_USERS, INITIAL_SCHOOL_DATABASE } from './data/mockData.ts';
import {
  UserAccount,
  SchoolDatabase,
  Student,
  Teacher,
  TeacherApplicant,
  AttendanceRecord,
  Announcement,
  DirectMessage,
} from './types/school.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEMO_USERS[2]); // Default: Dr. Evelyn Reed (Principal)
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [db, setDb] = useState<SchoolDatabase>(INITIAL_SCHOOL_DATABASE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showOpenScreen, setShowOpenScreen] = useState<boolean>(true);
  const [quickAskOpen, setQuickAskOpen] = useState<boolean>(false);
  const [inspectedStudent, setInspectedStudent] = useState<Student | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [appNotice, setAppNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showAppNotice = (type: 'success' | 'error', text: string) => {
    setAppNotice({ type, text });
    setTimeout(() => setAppNotice(null), 4000);
  };

  // Sync theme with HTML class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load database from API
  const fetchDatabase = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.success && json.data) {
        setDb(json.data);
      }
    } catch (e) {
      console.warn('Backend API unavailable, using seed mock database', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  // Reset database handler (non-blocking confirmation modal)
  const handleResetData = () => {
    setConfirmResetOpen(true);
  };

  const confirmAndResetData = async () => {
    setConfirmResetOpen(false);
    try {
      setIsLoading(true);
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setDb(json.data);
        showAppNotice('success', 'School database restored to initial baseline records.');
      }
    } catch {
      setDb(INITIAL_SCHOOL_DATABASE);
      showAppNotice('success', 'School database restored locally.');
    } finally {
      setIsLoading(false);
    }
  };

  // API Mutators
  const handleAddStudent = async (studentData: Partial<Student>) => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        students: [json.student, ...prev.students],
        invoices: [json.invoice, ...prev.invoices],
      }));
    }
    return json;
  };

  const handleUpdateStudent = async (id: string, updates: Partial<Student>) => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        students: prev.students.map(s => (s.id === id ? json.student : s)),
      }));
    }
    return json;
  };

  const handleDeleteStudent = async (id: string) => {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        students: prev.students.filter(s => s.id !== id),
      }));
    }
    return json;
  };

  const handleBulkImport = async (incomingStudents: Partial<Student>[]) => {
    const res = await fetch('/api/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: incomingStudents }),
    });
    const json = await res.json();
    if (json.success && json.students) {
      setDb(prev => ({
        ...prev,
        students: [...json.students, ...prev.students],
      }));
    }
    return json;
  };

  const handleAddTeacher = async (teacherData: Partial<Teacher>) => {
    const res = await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        teachers: [json.teacher, ...prev.teachers],
      }));
    }
    return json;
  };

  const handleDeleteTeacher = async (id: string) => {
    const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        teachers: prev.teachers.filter(t => t.id !== id),
      }));
    }
    return json;
  };

  const handleAddTeacherApplicant = async (applicantData: Partial<TeacherApplicant>) => {
    const res = await fetch('/api/teacher-applicants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicantData),
    });
    const json = await res.json();
    if (json.success && json.applicant) {
      setDb(prev => ({
        ...prev,
        teacherApplicants: [json.applicant, ...(prev.teacherApplicants || [])],
      }));
    }
    return json;
  };

  const handleUpdateApplicantStatus = async (
    id: string,
    interviewStatus: TeacherApplicant['interviewStatus']
  ) => {
    const res = await fetch(`/api/teacher-applicants/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewStatus }),
    });
    const json = await res.json();
    if (json.success && json.applicant) {
      setDb(prev => ({
        ...prev,
        teacherApplicants: (prev.teacherApplicants || []).map(a =>
          a.id === id ? json.applicant : a
        ),
      }));
    }
    return json;
  };

  const handleScheduleTeacherInterview = async (
    id: string,
    slot: {
      interviewDate: string;
      interviewTime: string;
      interviewerName: string;
      interviewVenue: string;
      notes?: string;
    }
  ) => {
    const res = await fetch(`/api/teacher-applicants/${id}/schedule-interview`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot),
    });
    const json = await res.json();
    if (json.success && json.applicant) {
      setDb(prev => ({
        ...prev,
        teacherApplicants: (prev.teacherApplicants || []).map(a =>
          a.id === id ? json.applicant : a
        ),
      }));
      showAppNotice(
        'success',
        `Interview booked for ${json.applicant.firstName} ${json.applicant.lastName} on ${slot.interviewDate} at ${slot.interviewTime}.`
      );
    }
    return json;
  };

  const handleHireTeacherApplicant = async (id: string) => {
    const res = await fetch(`/api/teacher-applicants/${id}/hire`, { method: 'PUT' });
    const json = await res.json();
    if (json.success && json.applicant && json.teacher) {
      setDb(prev => ({
        ...prev,
        teachers: [json.teacher, ...prev.teachers],
        teacherApplicants: (prev.teacherApplicants || []).map(a =>
          a.id === id ? json.applicant : a
        ),
      }));
      showAppNotice(
        'success',
        `Hired ${json.teacher.firstName} ${json.teacher.lastName} (${json.teacher.employeeId}) to ${json.teacher.department}.`
      );
    }
    return json;
  };

  const handleSaveAttendance = async (records: AttendanceRecord[]) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => {
        const incoming = (json.records || records) as AttendanceRecord[];
        const mergedAttendance = [...prev.attendance];
        incoming.forEach(rec => {
          const idx = mergedAttendance.findIndex(
            a => a.studentId === rec.studentId && a.date === rec.date
          );
          if (idx !== -1) {
            mergedAttendance[idx] = rec;
          } else {
            mergedAttendance.push(rec);
          }
        });
        return {
          ...prev,
          attendance: mergedAttendance,
          students: json.updatedStudents || prev.students,
        };
      });
    }
    return json;
  };

  const handleNotifyAbsentees = async (date: string, studentIds: string[]) => {
    const res = await fetch('/api/attendance/notify-absentees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        studentIds,
        senderName: currentUser.name,
        senderRole: currentUser.role,
      }),
    });
    const json = await res.json();
    if (json.success && json.messages) {
      setDb(prev => ({
        ...prev,
        messages: [...json.messages, ...(prev.messages || [])],
      }));
    }
    return json;
  };

  const handleSendMessage = async (msgData: Partial<DirectMessage>) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: msgData.senderName || currentUser.name,
        senderRole: msgData.senderRole || currentUser.role,
        ...msgData,
      }),
    });
    const json = await res.json();
    if (json.success && json.message) {
      setDb(prev => ({
        ...prev,
        messages: [json.message, ...(prev.messages || [])],
      }));
    }
    return json;
  };

  const handleRecordPayment = async (paymentData: any) => {
    const res = await fetch('/api/fees/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        payments: [json.payment, ...prev.payments],
        invoices: prev.invoices.map(inv =>
          inv.id === json.invoice.id ? json.invoice : inv
        ),
      }));
    }
    return json;
  };

  const handleSaveMark = async (markData: any) => {
    const res = await fetch('/api/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => {
        const idx = prev.marks.findIndex(m => m.id === json.mark.id);
        const nextMarks = [...prev.marks];
        if (idx !== -1) {
          nextMarks[idx] = json.mark;
        } else {
          nextMarks.push(json.mark);
        }
        return { ...prev, marks: nextMarks };
      });
    }
    return json;
  };

  const handleAddHomework = async (hwData: any) => {
    const res = await fetch('/api/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hwData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        homework: [json.homework, ...prev.homework],
      }));
    }
    return json;
  };

  const handleAddAnnouncement = async (annData: Partial<Announcement>) => {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        announcements: [json.announcement, ...prev.announcements],
      }));
    }
    return json;
  };

  const handleAddVisitor = async (visData: any) => {
    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        visitors: [json.visitor, ...prev.visitors],
      }));
    }
    return json;
  };

  const handleCheckOutVisitor = async (id: string) => {
    const res = await fetch(`/api/visitors/${id}/checkout`, { method: 'PUT' });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        visitors: prev.visitors.map(v => (v.id === id ? json.visitor : v)),
      }));
    }
    return json;
  };

  const handleAddCertificate = async (certData: any) => {
    const res = await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(certData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        certificates: [json.certificate, ...prev.certificates],
      }));
    }
    return json;
  };

  const handleAddEnquiry = async (enqData: any) => {
    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enqData),
    });
    const json = await res.json();
    if (json.success) {
      setDb(prev => ({
        ...prev,
        enquiries: [json.enquiry, ...prev.enquiries],
      }));
    }
    return json;
  };

  const handleMarkEnquiryAdmitted = async (enquiryId: string) => {
    const res = await fetch(`/api/enquiries/${enquiryId}/admit`, { method: 'PUT' });
    const json = await res.json();
    if (json.success && json.enquiry) {
      setDb(prev => ({
        ...prev,
        enquiries: prev.enquiries.map(e => (e.id === enquiryId ? json.enquiry : e)),
      }));
    }
    return json;
  };

  // When switching role, optionally route to their designated home screen
  const handleSelectUser = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'student') {
      setCurrentTab('student_portal');
    } else if (user.role === 'parent') {
      setCurrentTab('parent_portal');
    } else if (user.role === 'teacher') {
      setCurrentTab('attendance');
    } else if (user.role === 'accountant') {
      setCurrentTab('fees');
    } else if (user.role === 'librarian') {
      setCurrentTab('library');
    } else if (user.role === 'transport_manager') {
      setCurrentTab('transport');
    } else if (user.role === 'receptionist') {
      setCurrentTab('certificates_visitors');
    } else {
      setCurrentTab('dashboard');
    }
  };

  if (showOpenScreen) {
    return (
      <OpenScreenView
        onEnterAsUser={user => {
          handleSelectUser(user);
          setShowOpenScreen(false);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        students={db.students}
        onSelectUser={handleSelectUser}
        onInspectStudent={setInspectedStudent}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenAI={() => setCurrentTab('ai_center')}
        onResetData={handleResetData}
        onOpenWelcomeScreen={() => setShowOpenScreen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(v => !v)}
        isLoadingData={isLoading}
      />

      {appNotice && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shadow-xl border border-slate-700">
          {appNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{appNotice.text}</span>
          <button
            onClick={() => setAppNotice(null)}
            className="ml-2 text-slate-400 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              db={db}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onOpenNewAdmission={() => setCurrentTab('students')}
              onOpenFeePayment={() => setCurrentTab('fees')}
              onInspectStudent={setInspectedStudent}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentTab === 'students' && (
            <StudentManagementView
              students={db.students}
              enquiries={db.enquiries}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkImport={handleBulkImport}
              onMarkEnquiryAdmitted={handleMarkEnquiryAdmitted}
              onInspectStudent={setInspectedStudent}
            />
          )}

          {currentTab === 'staff' && (
            <StaffManagementView
              teachers={db.teachers}
              teacherApplicants={db.teacherApplicants || []}
              onAddTeacher={handleAddTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onAddApplicant={handleAddTeacherApplicant}
              onUpdateApplicantStatus={handleUpdateApplicantStatus}
              onScheduleInterview={handleScheduleTeacherInterview}
              onHireApplicant={handleHireTeacherApplicant}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceView
              students={db.students}
              attendanceRecords={db.attendance}
              onSaveAttendance={handleSaveAttendance}
              onNotifyAbsentees={handleNotifyAbsentees}
              onInspectStudent={setInspectedStudent}
            />
          )}

          {currentTab === 'academics' && (
            <AcademicsView
              timetable={db.timetable}
              homeworkList={db.homework}
              teachers={db.teachers}
              onAddHomework={handleAddHomework}
            />
          )}

          {currentTab === 'examinations' && (
            <ExaminationsView
              exams={db.exams}
              marks={db.marks}
              students={db.students}
              onSaveMark={handleSaveMark}
            />
          )}

          {currentTab === 'fees' && (
            <FeesFinanceView
              invoices={db.invoices}
              payments={db.payments}
              expenses={db.expenses}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {currentTab === 'parent_portal' && (
            <ParentPortalView
              db={db}
              onPayFee={invoiceId => setCurrentTab('fees')}
              onNavigateToAI={() => setCurrentTab('ai_center')}
            />
          )}

          {currentTab === 'student_portal' && (
            <StudentPortalView
              db={db}
              onSendMessage={handleSendMessage}
              onNavigateToAI={() => setCurrentTab('ai_center')}
            />
          )}

          {currentTab === 'transport' && (
            <TransportView buses={db.buses} />
          )}

          {currentTab === 'library' && (
            <LibraryView books={db.books} />
          )}

          {currentTab === 'hostel' && (
            <HostelView rooms={db.hostelRooms} />
          )}

          {currentTab === 'communication' && (
            <CommunicationView
              announcements={db.announcements}
              messages={db.messages || []}
              students={db.students}
              teachers={db.teachers}
              currentUser={currentUser}
              onAddAnnouncement={handleAddAnnouncement}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentTab === 'ai_center' && (
            <AIIntelligenceCenterView
              db={db}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'website' && (
            <PublicWebsiteView
              enquiries={db.enquiries}
              onAddEnquiry={handleAddEnquiry}
            />
          )}

          {currentTab === 'certificates_visitors' && (
            <CertificatesAndVisitorsView
              certificates={db.certificates}
              visitors={db.visitors}
              students={db.students}
              onAddCertificate={handleAddCertificate}
              onAddVisitor={handleAddVisitor}
              onCheckOutVisitor={handleCheckOutVisitor}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsExportView db={db} />
          )}
        </main>
      </div>

      {/* Complete Student Dossier & Quick Message Modal */}
      <StudentDossierModal
        student={inspectedStudent}
        db={db}
        currentUser={currentUser}
        onClose={() => setInspectedStudent(null)}
        onSendMessage={handleSendMessage}
      />

      {/* Reset Database Confirmation Modal */}
      <Modal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Reset School Database?"
        subtitle="Restore all student, attendance, communication, and finance records to baseline state."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Any newly saved attendance changes, direct messages, or newly enrolled students in this session will be replaced with the initial STAR AI campus dataset.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(false)}
              className="px-3.5 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAndResetData}
              className="px-3.5 py-2 font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Confirm Reset</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Global Quick Ask Gemini AI Drawer */}
      <QuickAskDrawer
        isOpen={quickAskOpen}
        onOpen={() => setQuickAskOpen(true)}
        onClose={() => setQuickAskOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
