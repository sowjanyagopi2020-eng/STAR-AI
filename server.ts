import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { INITIAL_SCHOOL_DATABASE } from './src/data/mockData.ts';
import { generateRegistrationNumber, calculateStudentGrade } from './src/utils/schoolMath.ts';
import {
  buildSchoolSnapshot,
  buildGeminiSystemInstruction,
  needsSchoolSnapshot,
  formatGeminiErrorMessage,
  DEFAULT_IMAGE_PROMPT,
  AIChatTurn,
} from './src/utils/aiHelpers.ts';
import {
  SchoolDatabase,
  Student,
  Teacher,
  AttendanceRecord,
  FeeInvoice,
  PaymentTransaction,
  DirectMessage,
} from './src/types/school.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// In-memory database with fallback to seed data
let db: SchoolDatabase = JSON.parse(JSON.stringify(INITIAL_SCHOOL_DATABASE));

// Cached Gemini AI client on server-side
let cachedAi: GoogleGenAI | null = null;
let cachedKey: string | undefined;

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  if (!cachedAi || cachedKey !== key) {
    cachedKey = key;
    cachedAi = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAi;
}

// ================= API ROUTES =================

// Get entire database state
app.get('/api/data', (req, res) => {
  res.json({ success: true, data: db });
});

// Reset database to initial seed data
app.post('/api/reset-data', (req, res) => {
  db = JSON.parse(JSON.stringify(INITIAL_SCHOOL_DATABASE));
  res.json({ success: true, message: 'Database reset to initial school records', data: db });
});

// --- Students ---
app.post('/api/students', (req, res) => {
  try {
    const studentData: Partial<Student> = req.body;
    const nextSeq = db.students.length + 1;
    const gradeCode = (studentData.classGrade || 'Grade 10').replace('Grade ', '');
    const sectionCode = studentData.section || 'A';
    const classCount =
      db.students.filter(
        s => s.classGrade === (studentData.classGrade || 'Grade 10') && s.section === sectionCode
      ).length + 1;
    const regNo = studentData.regNo || generateRegistrationNumber('STAR', 2026, nextSeq);
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      regNo,
      rollNo:
        studentData.rollNo || `${gradeCode}${sectionCode}-${String(classCount).padStart(2, '0')}`,
      firstName: studentData.firstName || 'Student',
      lastName: studentData.lastName || 'Name',
      dateOfBirth: studentData.dateOfBirth || '2010-01-01',
      gender: studentData.gender || 'Other',
      classGrade: studentData.classGrade || 'Grade 10',
      section: studentData.section || 'A',
      bloodGroup: studentData.bloodGroup || 'O+',
      parentName: studentData.parentName || 'Parent Guardian',
      parentPhone: studentData.parentPhone || '+1 (555) 000-0000',
      parentEmail: studentData.parentEmail || 'parent@example.com',
      address: studentData.address || 'Campus Residence',
      admissionDate: studentData.admissionDate || new Date().toISOString().split('T')[0],
      emergencyContact: studentData.emergencyContact || '+1 (555) 000-0000',
      status: 'Active',
      attendanceRate: 100,
    };

    db.students.unshift(newStudent);

    // Automatically create a tuition invoice for the new student
    const newInvoice: FeeInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: newStudent.id,
      studentName: `${newStudent.firstName} ${newStudent.lastName}`,
      classGrade: newStudent.classGrade,
      section: newStudent.section,
      feeType: 'New Admission & Term Tuition Fee',
      amount: 3500,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
    };
    db.invoices.unshift(newInvoice);

    res.json({ success: true, student: newStudent, invoice: newInvoice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Student not found' });
  }
  db.students[index] = { ...db.students[index], ...req.body };
  res.json({ success: true, student: db.students[index] });
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  db.students = db.students.filter(s => s.id !== id);
  res.json({ success: true, message: 'Student removed' });
});

// Bulk import students
app.post('/api/students/bulk', (req, res) => {
  const { students: incomingStudents } = req.body;
  if (!Array.isArray(incomingStudents) || incomingStudents.length === 0) {
    return res.status(400).json({ success: false, error: 'No students array provided' });
  }

  const added: Student[] = [];
  incomingStudents.forEach((raw, i) => {
    const nextSeq = db.students.length + 1;
    const student: Student = {
      id: `stu-${Date.now()}-${i}`,
      regNo: raw.regNo || generateRegistrationNumber('STAR', 2026, nextSeq),
      rollNo: raw.rollNo || `BULK-${nextSeq}`,
      firstName: raw.firstName || 'Imported',
      lastName: raw.lastName || 'Student',
      dateOfBirth: raw.dateOfBirth || '2010-01-01',
      gender: raw.gender || 'Other',
      classGrade: raw.classGrade || 'Grade 10',
      section: raw.section || 'A',
      bloodGroup: raw.bloodGroup || 'O+',
      parentName: raw.parentName || 'Parent Name',
      parentPhone: raw.parentPhone || '+1 (555) 000-0000',
      parentEmail: raw.parentEmail || 'parent@import.com',
      address: raw.address || 'Imported Address',
      admissionDate: new Date().toISOString().split('T')[0],
      emergencyContact: raw.emergencyContact || '+1 (555) 000-0000',
      status: 'Active',
      attendanceRate: 95.0,
    };
    db.students.unshift(student);
    added.push(student);
  });

  res.json({ success: true, count: added.length, students: added });
});

// --- Teachers ---
app.post('/api/teachers', (req, res) => {
  const teacherData: Partial<Teacher> = req.body;
  const newTeacher: Teacher = {
    id: `tch-${Date.now()}`,
    employeeId: teacherData.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    firstName: teacherData.firstName || 'Teacher',
    lastName: teacherData.lastName || 'Staff',
    email: teacherData.email || 'faculty@starai.edu',
    phone: teacherData.phone || '+1 (555) 000-0000',
    designation: teacherData.designation || 'Instructor',
    department: teacherData.department || 'Academics',
    qualification: teacherData.qualification || 'M.Sc., B.Ed.',
    experienceYears: Number(teacherData.experienceYears) || 5,
    joiningDate: teacherData.joiningDate || new Date().toISOString().split('T')[0],
    subjectsTaught: teacherData.subjectsTaught || ['General Science'],
    salaryMonthly: Number(teacherData.salaryMonthly) || 5500,
    status: 'Active',
  };
  db.teachers.unshift(newTeacher);
  res.json({ success: true, teacher: newTeacher });
});

app.put('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const index = db.teachers.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Teacher not found' });
  }
  db.teachers[index] = { ...db.teachers[index], ...req.body };
  res.json({ success: true, teacher: db.teachers[index] });
});

app.delete('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  db.teachers = db.teachers.filter(t => t.id !== id);
  res.json({ success: true, message: 'Teacher record deleted' });
});

// --- Teacher Applicants (Waitlist for Teaching Positions) ---
app.post('/api/teacher-applicants', (req, res) => {
  const raw = req.body || {};
  const nextIdx = (db.teacherApplicants?.length || 0) + 1;
  const applicant = {
    id: `cand-${Date.now()}`,
    applicantCode: `CAND-2026-${String(nextIdx).padStart(2, '0')}`,
    firstName: raw.firstName || 'Applicant',
    lastName: raw.lastName || 'Teacher',
    email: raw.email || 'candidate@educators.org',
    phone: raw.phone || '+1 (555) 000-0000',
    department: raw.department || 'Mathematics',
    desiredDesignation: raw.desiredDesignation || 'Faculty Instructor',
    qualification: raw.qualification || 'M.Sc., B.Ed.',
    experienceYears: Number(raw.experienceYears) || 4,
    subjects: Array.isArray(raw.subjects)
      ? raw.subjects
      : String(raw.subjects || 'General Academics')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
    expectedSalaryMonthly: Number(raw.expectedSalaryMonthly) || 5500,
    availableFrom: raw.availableFrom || 'Immediate',
    appliedDate: new Date().toISOString().split('T')[0],
    interviewStatus: 'Waiting for Review' as const,
    notes: raw.notes || 'Application submitted via HR Recruitment Desk.',
  };
  if (!db.teacherApplicants) db.teacherApplicants = [];
  db.teacherApplicants.unshift(applicant);
  res.json({ success: true, applicant });
});

app.put('/api/teacher-applicants/:id/status', (req, res) => {
  const { id } = req.params;
  const { interviewStatus } = req.body || {};
  const applicant = (db.teacherApplicants || []).find(a => a.id === id);
  if (!applicant) {
    return res.status(404).json({ success: false, error: 'Teaching applicant not found' });
  }
  if (interviewStatus) {
    applicant.interviewStatus = interviewStatus;
  }
  res.json({ success: true, applicant });
});

app.put('/api/teacher-applicants/:id/schedule-interview', (req, res) => {
  const { id } = req.params;
  const { interviewDate, interviewTime, interviewerName, interviewVenue, notes } = req.body || {};
  const applicant = (db.teacherApplicants || []).find(a => a.id === id);
  if (!applicant) {
    return res.status(404).json({ success: false, error: 'Teaching applicant not found' });
  }
  if (!interviewDate || !interviewTime) {
    return res.status(400).json({
      success: false,
      error: 'Interview date and time slot are required.',
    });
  }

  applicant.interviewStatus = 'Interview Scheduled';
  applicant.interviewDate = String(interviewDate);
  applicant.interviewTime = String(interviewTime);
  applicant.interviewerName = interviewerName ? String(interviewerName) : 'Hiring Panel';
  applicant.interviewVenue = interviewVenue ? String(interviewVenue) : 'Campus Conference Room';
  if (typeof notes === 'string' && notes.trim()) {
    applicant.notes = notes.trim();
  }

  res.json({ success: true, applicant });
});

app.put('/api/teacher-applicants/:id/hire', (req, res) => {
  const { id } = req.params;
  const applicant = (db.teacherApplicants || []).find(a => a.id === id);
  if (!applicant) {
    return res.status(404).json({ success: false, error: 'Teaching applicant not found' });
  }
  applicant.interviewStatus = 'Hired';

  const newTeacher: Teacher = {
    id: `tch-${Date.now()}`,
    employeeId: `EMP-${101 + db.teachers.length}`,
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email.replace(/@.+$/, '@starai.edu'),
    phone: applicant.phone,
    designation: applicant.desiredDesignation,
    department: applicant.department,
    qualification: applicant.qualification,
    experienceYears: applicant.experienceYears,
    joiningDate: new Date().toISOString().split('T')[0],
    subjectsTaught: applicant.subjects,
    salaryMonthly: applicant.expectedSalaryMonthly,
    status: 'Active',
  };
  db.teachers.unshift(newTeacher);
  res.json({ success: true, applicant, teacher: newTeacher });
});

// --- Attendance ---
app.post('/api/attendance', (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'Invalid attendance records format' });
  }

  const savedRecords: AttendanceRecord[] = [];
  const updatedStudents: Student[] = [];

  // Update or insert records for specified date & student
  records.forEach((rec: AttendanceRecord) => {
    const existingIndex = db.attendance.findIndex(
      a => a.date === rec.date && a.studentId === rec.studentId
    );
    let saved: AttendanceRecord;
    if (existingIndex !== -1) {
      saved = { ...db.attendance[existingIndex], ...rec };
      db.attendance[existingIndex] = saved;
    } else {
      const newId = rec.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      saved = { ...rec, id: newId };
      db.attendance.push(saved);
    }
    savedRecords.push(saved);

    // Recalculate attendance rate for that student (Late counts as 0.5, Excused as 1)
    const studentRecords = db.attendance.filter(a => a.studentId === rec.studentId);
    const presentScore = studentRecords.reduce((acc, a) => {
      if (a.status === 'Present' || a.status === 'Excused') return acc + 1;
      if (a.status === 'Late') return acc + 0.5;
      return acc;
    }, 0);
    const rate = studentRecords.length > 0 ? Math.round((presentScore / studentRecords.length) * 1000) / 10 : 100;
    const sIndex = db.students.findIndex(s => s.id === rec.studentId);
    if (sIndex !== -1) {
      db.students[sIndex].attendanceRate = rate;
      updatedStudents.push(db.students[sIndex]);
    }
  });

  res.json({
    success: true,
    message: `Recorded ${savedRecords.length} attendance entries`,
    records: savedRecords,
    updatedStudents,
  });
});

// Auto-notify parents & students for absent records
app.post('/api/attendance/notify-absentees', (req, res) => {
  const { date, studentIds, senderName, senderRole } = req.body || {};
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, error: 'No absent students specified' });
  }

  const created: DirectMessage[] = [];
  const stamp = `${date || new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  studentIds.forEach((sid: string, idx: number) => {
    const stu = db.students.find(s => s.id === sid);
    if (!stu) return;
    const msg: DirectMessage = {
      id: `msg-${Date.now()}-${idx}`,
      senderName: senderName || 'Attendance Office',
      senderRole: senderRole || 'teacher',
      recipientType: 'Parent',
      recipientId: stu.id,
      recipientName: `${stu.parentName} (Parent of ${stu.firstName} ${stu.lastName})`,
      subject: `Attendance Alert (${date || 'Today'}): ${stu.firstName} ${stu.lastName}`,
      body: `Dear ${stu.parentName}, ${stu.firstName} ${stu.lastName} (${stu.classGrade}-${stu.section}, Roll ${stu.rollNo}) was marked Absent on ${date || 'today'}. Current attendance is ${stu.attendanceRate}%. Please reply with a reason or medical note.`,
      channel: 'SMS + WhatsApp',
      timestamp: stamp,
      read: false,
    };
    db.messages.unshift(msg);
    created.push(msg);
  });

  res.json({ success: true, count: created.length, messages: created });
});

// --- Fees & Finance ---
app.post('/api/fees/payment', (req, res) => {
  const { invoiceId, amount, paymentMethod, transactionRef } = req.body;
  const invoice = db.invoices.find(inv => inv.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }

  const payAmt = Number(amount);
  const newPaidAmount = (invoice.paidAmount || 0) + payAmt;
  invoice.paidAmount = newPaidAmount;
  invoice.status = newPaidAmount >= invoice.amount ? 'Paid' : 'Partial';

  const receiptNo = `RCP-${Math.floor(10000 + Math.random() * 90000)}`;
  const payment: PaymentTransaction = {
    id: `pmt-${Date.now()}`,
    invoiceId: invoice.id,
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    amount: payAmt,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod || 'UPI',
    transactionRef: transactionRef || `TXN-${Date.now()}`,
    receiptNo,
  };

  db.payments.unshift(payment);
  res.json({ success: true, payment, invoice });
});

// --- Marks Entry ---
app.post('/api/marks', (req, res) => {
  const { examId, studentId, studentName, classGrade, section, subjectName, marksObtained, maxMarks } = req.body;
  const gradeInfo = calculateStudentGrade(Number(marksObtained), Number(maxMarks) || 100);

  const existingIdx = db.marks.findIndex(
    m => m.examId === examId && m.studentId === studentId && m.subjectName === subjectName
  );

  const markRecord = {
    id: existingIdx !== -1 ? db.marks[existingIdx].id : `mk-${Date.now()}`,
    examId,
    studentId,
    studentName,
    classGrade,
    section,
    subjectName,
    marksObtained: Number(marksObtained),
    maxMarks: Number(maxMarks) || 100,
    grade: gradeInfo.grade,
    remarks: gradeInfo.status,
  };

  if (existingIdx !== -1) {
    db.marks[existingIdx] = markRecord;
  } else {
    db.marks.push(markRecord);
  }

  res.json({ success: true, mark: markRecord });
});

// --- Homework ---
app.post('/api/homework', (req, res) => {
  const hwData = req.body;
  const newHw = {
    id: `hw-${Date.now()}`,
    classGrade: hwData.classGrade || 'Grade 10',
    section: hwData.section || 'A',
    subjectName: hwData.subjectName || 'General',
    teacherName: hwData.teacherName || 'Faculty',
    title: hwData.title || 'Assignment',
    description: hwData.description || '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: hwData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    submissionsCount: 0,
    totalStudents: db.students.filter(s => s.classGrade === hwData.classGrade).length || 28,
  };
  db.homework.unshift(newHw);
  res.json({ success: true, homework: newHw });
});

// --- Announcements ---
app.post('/api/announcements', (req, res) => {
  const newAnn = {
    id: `ann-${Date.now()}`,
    title: req.body.title || 'School Circular',
    content: req.body.content || '',
    targetAudience: req.body.targetAudience || 'All',
    priority: req.body.priority || 'Normal',
    date: new Date().toISOString().split('T')[0],
    author: req.body.author || 'Administration',
  };
  db.announcements.unshift(newAnn);
  res.json({ success: true, announcement: newAnn });
});

// --- Direct Two-Way Messages (Teachers <-> Students & Parents) ---
app.post('/api/messages', (req, res) => {
  const { senderName, senderRole, recipientType, recipientId, recipientName, subject, body, channel } = req.body || {};
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ success: false, error: 'Message subject and body are required' });
  }
  const newMsg: DirectMessage = {
    id: `msg-${Date.now()}`,
    senderName: senderName || 'STAR AI User',
    senderRole: senderRole || 'teacher',
    recipientType: recipientType || 'Student',
    recipientId: recipientId || 'all',
    recipientName: recipientName || 'Recipient',
    subject: subject.trim(),
    body: body.trim(),
    channel: channel || 'In-App',
    timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    read: false,
  };
  db.messages.unshift(newMsg);
  res.json({ success: true, message: newMsg });
});

// --- Visitors ---
app.post('/api/visitors', (req, res) => {
  const newVisitor = {
    id: `vis-${Date.now()}`,
    visitorName: req.body.visitorName || 'Visitor',
    phone: req.body.phone || '',
    purpose: req.body.purpose || 'Campus Visit',
    personToMeet: req.body.personToMeet || 'Reception',
    checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    passNumber: `GP-2026-${Math.floor(100 + Math.random() * 900)}`,
    status: 'Active' as const,
  };
  db.visitors.unshift(newVisitor);
  res.json({ success: true, visitor: newVisitor });
});

app.put('/api/visitors/:id/checkout', (req, res) => {
  const { id } = req.params;
  const vis = db.visitors.find(v => v.id === id);
  if (!vis) return res.status(404).json({ success: false, error: 'Visitor not found' });
  vis.status = 'Checked Out';
  vis.checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  res.json({ success: true, visitor: vis });
});

// --- Certificates ---
app.post('/api/certificates', (req, res) => {
  const newCert = {
    id: `cert-${Date.now()}`,
    certType: req.body.certType || 'Bonafide Certificate',
    studentId: req.body.studentId || '',
    studentName: req.body.studentName || 'Student Name',
    issueDate: new Date().toISOString().split('T')[0],
    certificateNumber: `CERT-${Date.now().toString().slice(-6)}`,
    reason: req.body.reason || 'Official verification',
    status: 'Issued' as const,
  };
  db.certificates.unshift(newCert);
  res.json({ success: true, certificate: newCert });
});

// --- Enquiries ---
app.post('/api/enquiries', (req, res) => {
  const newEnquiry = {
    id: `enq-${Date.now()}`,
    studentName: req.body.studentName,
    parentName: req.body.parentName,
    contactNumber: req.body.contactNumber,
    email: req.body.email,
    gradeApplied: req.body.gradeApplied || 'Grade 9',
    enquiryDate: new Date().toISOString().split('T')[0],
    status: 'New' as const,
    notes: req.body.notes || 'Online web portal submission',
  };
  db.enquiries.unshift(newEnquiry);
  res.json({ success: true, enquiry: newEnquiry });
});

app.put('/api/enquiries/:id/admit', (req, res) => {
  const { id } = req.params;
  const enq = db.enquiries.find(e => e.id === id);
  if (!enq) return res.status(404).json({ success: false, error: 'Enquiry not found' });
  enq.status = 'Admitted';
  res.json({ success: true, enquiry: enq });
});

// ================= AI INTELLIGENCE CENTER (GEMINI API) =================

function buildGeminiPayload(reqBody: any) {
  const { mode, speedMode, prompt, image, contextData, role, history } = reqBody || {};
  const activeMode = mode || 'universal_qa';
  const hasValidImage = Boolean(
    image &&
      typeof image.data === 'string' &&
      image.data.trim().length > 0 &&
      typeof image.mimeType === 'string' &&
      image.mimeType.startsWith('image/')
  );
  const promptText = String(prompt || '').trim() || (hasValidImage ? DEFAULT_IMAGE_PROMPT : '');
  const includeSnapshot = needsSchoolSnapshot(promptText, activeMode);

  const extraContext =
    includeSnapshot && contextData && Object.keys(contextData).length > 0
      ? `\nCurrent UI Context: ${JSON.stringify(contextData)}`
      : '';

  const baseInstruction = buildGeminiSystemInstruction(activeMode, role);
  const systemInstruction = includeSnapshot
    ? `${baseInstruction}\n\nLive School Snapshot:\n${buildSchoolSnapshot(db)}${extraContext}`
    : baseInstruction;

  const safeHistory: AIChatTurn[] = Array.isArray(history)
    ? history
        .filter(
          (t: any): t is AIChatTurn =>
            t && (t.role === 'user' || t.role === 'model') && typeof t.text === 'string' && t.text.trim().length > 0
        )
        .slice(-8)
    : [];

  const userParts: any[] = [];
  if (hasValidImage) {
    userParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  }
  userParts.push({ text: promptText });

  const contents = [
    ...safeHistory.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    {
      role: 'user' as const,
      parts: userParts,
    },
  ];

  const isInstant = speedMode !== 'balanced';
  const model = isInstant ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
  const thinkingLevel = isInstant ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;

  return { model, thinkingLevel, systemInstruction, contents, hasValidImage, promptText };
}

// Streaming SSE endpoint for fastest time-to-first-token
app.post('/api/gemini/stream', async (req, res) => {
  const rawPrompt = String(req.body?.prompt || '').trim();
  const hasImage = Boolean(req.body?.image?.data && req.body?.image?.mimeType);
  if (!rawPrompt && !hasImage) {
    return res.status(400).json({ success: false, error: 'Please enter a question or upload an image.' });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured. Please check your key in Settings > Secrets.',
    });
  }

  const { model, thinkingLevel, systemInstruction, contents } = buildGeminiPayload(req.body);
  const startMs = Date.now();
  let clientClosed = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientClosed = true;
    }
  });

  res.socket?.setNoDelay?.(true);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(': stream-open\n\n');

  const sendEvent = (payload: Record<string, unknown>) => {
    if (!clientClosed && !res.writableEnded) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  };

  let activeModel = model;
  let sentAnyChunk = false;
  const attemptStream = async (targetModel: string, targetThinking: ThinkingLevel) => {
    activeModel = targetModel;
    const stream = await client.models.generateContentStream({
      model: targetModel,
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: targetThinking },
      },
    });

    for await (const chunk of stream) {
      if (clientClosed) break;
      const chunkText = chunk.text;
      if (chunkText) {
        sentAnyChunk = true;
        sendEvent({ text: chunkText });
      }
    }
  };

  try {
    try {
      await attemptStream(model, thinkingLevel);
    } catch (firstErr: any) {
      // Fast model fallback or immediate single retry before first token
      if (!sentAnyChunk && !clientClosed) {
        if (model === 'gemini-3.1-flash-lite') {
          await attemptStream('gemini-4-hydrogen', ThinkingLevel.LOW);
        } else {
          await new Promise(r => setTimeout(r, 120));
          await attemptStream(model, thinkingLevel);
        }
      } else {
        throw firstErr;
      }
    }

    sendEvent({
      done: true,
      model: activeModel,
      latencyMs: Date.now() - startMs,
    });
  } catch (err: any) {
    console.error('Gemini stream error:', err?.message || err);
    const formatted = formatGeminiErrorMessage(err);
    sendEvent({ error: formatted.message });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

// Standard fast JSON endpoint
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const rawPrompt = String(req.body?.prompt || '').trim();
    const hasImage = Boolean(req.body?.image?.data && req.body?.image?.mimeType);
    if (!rawPrompt && !hasImage) {
      return res.status(400).json({ success: false, error: 'Please enter a question or upload an image.' });
    }

    const client = getGeminiClient();
    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured. Please check your key in Settings > Secrets.',
      });
    }

    const { model, thinkingLevel, systemInstruction, contents } = buildGeminiPayload(req.body);
    const startMs = Date.now();

    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel },
      },
    });

    const text = response.text || 'No response generated.';
    res.json({
      success: true,
      text,
      model,
      latencyMs: Date.now() - startMs,
    });
  } catch (error: any) {
    console.error('Gemini API error:', error?.message || error);
    const formatted = formatGeminiErrorMessage(error);
    res.status(formatted.status).json({
      success: false,
      error: formatted.message,
    });
  }
});

// ================= VITE DEV / PRODUCTION STATIC =================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STAR AI School ERP Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
