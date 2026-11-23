export type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'principal'
  | 'vice_principal'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'accountant'
  | 'librarian'
  | 'transport_manager'
  | 'hr_manager'
  | 'receptionist';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  employeeId?: string;
  studentId?: string;
  phone?: string;
  department?: string;
}

export interface Student {
  id: string;
  regNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  classGrade: string; // e.g. "Grade 10"
  section: string; // e.g. "A"
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  admissionDate: string;
  emergencyContact: string;
  photoUrl?: string;
  status: 'Active' | 'Transferred' | 'Withdrawn' | 'Graduated';
  attendanceRate: number;
}

export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  qualification: string;
  experienceYears: number;
  joiningDate: string;
  subjectsTaught: string[];
  salaryMonthly: number;
  status: 'Active' | 'On Leave' | 'Resigned';
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  classGrade: string;
  section: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periodNumber: number;
  startTime: string;
  endTime: string;
  classGrade: string;
  section: string;
  subjectName: string;
  teacherName: string;
  roomNumber: string;
}

export interface Exam {
  id: string;
  title: string;
  term: 'Quarterly' | 'Mid-Term' | 'Annual' | 'Unit Test';
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Published';
}

export interface MarkRecord {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  section: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks?: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  section: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'UPI' | 'Credit/Debit Card' | 'Net Banking' | 'Cash' | 'Cheque';
  transactionRef: string;
  receiptNo: string;
}

export interface SchoolExpense {
  id: string;
  category: 'Utilities' | 'Maintenance' | 'Lab Equipment' | 'Stationery' | 'Events' | 'Payroll';
  title: string;
  amount: number;
  date: string;
  paidTo: string;
  status: 'Paid' | 'Approved' | 'Pending';
}

export interface Homework {
  id: string;
  classGrade: string;
  section: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  submissionsCount: number;
  totalStudents: number;
}

export interface BusRoute {
  id: string;
  routeNumber: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  activeStudents: number;
  liveStatus: 'On Route' | 'At School' | 'Depot' | 'Delayed';
  currentStop: string;
  speedKmh: number;
  stops: { name: string; time: string }[];
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  rackLocation: string;
  status: 'Available' | 'Reserved' | 'Out of Stock';
}

export interface HostelRoom {
  id: string;
  roomNumber: string;
  block: string;
  floor: number;
  capacity: number;
  occupied: number;
  roomType: 'Standard' | 'Deluxe' | 'Air Conditioned';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Teachers' | 'Students' | 'Parents';
  priority: 'Normal' | 'High' | 'Emergency';
  date: string;
  author: string;
}

export interface VisitorEntry {
  id: string;
  visitorName: string;
  phone: string;
  purpose: string;
  personToMeet: string;
  checkInTime: string;
  checkOutTime?: string;
  passNumber: string;
  status: 'Active' | 'Checked Out';
}

export interface CertificateRecord {
  id: string;
  certType: 'Transfer Certificate' | 'Bonafide Certificate' | 'Character Certificate';
  studentId: string;
  studentName: string;
  issueDate: string;
  certificateNumber: string;
  reason: string;
  status: 'Issued' | 'Pending';
}

export interface AdmissionEnquiry {
  id: string;
  studentName: string;
  parentName: string;
  contactNumber: string;
  email: string;
  gradeApplied: string;
  enquiryDate: string;
  status: 'New' | 'Follow-up' | 'Admitted' | 'Closed';
  notes: string;
}

export interface DirectMessage {
  id: string;
  senderName: string;
  senderRole: string;
  recipientType: 'Student' | 'Parent' | 'Teacher' | 'Class';
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  channel: 'In-App' | 'SMS + WhatsApp' | 'Email + In-App';
  timestamp: string;
  read: boolean;
}

export interface TeacherApplicant {
  id: string;
  applicantCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  desiredDesignation: string;
  qualification: string;
  experienceYears: number;
  subjects: string[];
  expectedSalaryMonthly: number;
  availableFrom: string;
  appliedDate: string;
  interviewStatus: 'Waiting for Review' | 'Shortlisted' | 'Interview Scheduled' | 'Hired' | 'Declined';
  interviewDate?: string;
  interviewTime?: string;
  interviewerName?: string;
  interviewVenue?: string;
  notes: string;
}

export interface SchoolDatabase {
  students: Student[];
  teachers: Teacher[];
  teacherApplicants: TeacherApplicant[];
  attendance: AttendanceRecord[];
  timetable: TimetableSlot[];
  exams: Exam[];
  marks: MarkRecord[];
  invoices: FeeInvoice[];
  payments: PaymentTransaction[];
  expenses: SchoolExpense[];
  homework: Homework[];
  buses: BusRoute[];
  books: LibraryBook[];
  hostelRooms: HostelRoom[];
  announcements: Announcement[];
  messages: DirectMessage[];
  visitors: VisitorEntry[];
  certificates: CertificateRecord[];
  enquiries: AdmissionEnquiry[];
}
