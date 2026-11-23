/**
 * Pure calculation and business logic functions for STAR AI School ERP
 * Decoupled from UI for high performance and unit testing
 */

export interface GradeResult {
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  gpa: number;
  status: 'Distinction' | 'First Class' | 'Second Class' | 'Pass' | 'Needs Improvement' | 'Fail';
}

export function calculateStudentGrade(marks: number, totalMarks: number): GradeResult {
  if (totalMarks <= 0) {
    return { percentage: 0, grade: 'F', gpa: 0, status: 'Fail' };
  }

  const rawPercentage = (marks / totalMarks) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;

  if (percentage >= 90) {
    return { percentage, grade: 'A+', gpa: 4.0, status: 'Distinction' };
  } else if (percentage >= 80) {
    return { percentage, grade: 'A', gpa: 3.7, status: 'First Class' };
  } else if (percentage >= 70) {
    return { percentage, grade: 'B+', gpa: 3.3, status: 'First Class' };
  } else if (percentage >= 60) {
    return { percentage, grade: 'B', gpa: 3.0, status: 'Second Class' };
  } else if (percentage >= 50) {
    return { percentage, grade: 'C', gpa: 2.0, status: 'Pass' };
  } else if (percentage >= 40) {
    return { percentage, grade: 'D', gpa: 1.0, status: 'Needs Improvement' };
  } else {
    return { percentage, grade: 'F', gpa: 0.0, status: 'Fail' };
  }
}

export interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  isChronicAbsentee: boolean; // Below standard 75% threshold
}

export function calculateAttendanceStats(statuses: ('Present' | 'Absent' | 'Late' | 'Excused')[]): AttendanceStats {
  const total = statuses.length;
  if (total === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      percentage: 100,
      isChronicAbsentee: false,
    };
  }

  const presentCount = statuses.filter(s => s === 'Present').length;
  const lateCount = statuses.filter(s => s === 'Late').length;
  const absentCount = statuses.filter(s => s === 'Absent').length;

  // Late counts as 0.5 attendance in standard academic calculation
  const weightedPresent = presentCount + (lateCount * 0.5);
  const percentage = Math.round((weightedPresent / total) * 1000) / 10;

  return {
    totalSessions: total,
    presentCount,
    absentCount,
    lateCount,
    percentage,
    isChronicAbsentee: percentage < 75.0,
  };
}

export interface FeeCalculationItem {
  id: string;
  studentId: string;
  amount: number;
  paidAmount: number;
}

export interface FeeAggregateSummary {
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  collectionPercentage: number;
}

export function calculateFeeSummary(invoices: FeeCalculationItem[]): FeeAggregateSummary {
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalPending = Math.max(0, totalBilled - totalCollected);
  const collectionPercentage = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 0;

  return {
    totalBilled,
    totalCollected,
    totalPending,
    collectionPercentage,
  };
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function generateRegistrationNumber(prefix: string, year: number, seq: number): string {
  const padded = String(seq).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

export function detectAttendanceAnomalies(
  studentName: string,
  recentDays: ('Present' | 'Absent' | 'Late')[]
): { flagged: boolean; reason?: string } {
  if (recentDays.length < 3) return { flagged: false };

  // Consecutive absences
  const lastThree = recentDays.slice(-3);
  if (lastThree.every(status => status === 'Absent')) {
    return {
      flagged: true,
      reason: `${studentName} has been absent for 3 consecutive days. Immediate parent contact recommended.`,
    };
  }

  // Frequent tardiness
  const lateCount = recentDays.slice(-5).filter(s => s === 'Late').length;
  if (lateCount >= 3) {
    return {
      flagged: true,
      reason: `${studentName} was late ${lateCount} times in the last 5 days. Schedule a counseling session.`,
    };
  }

  return { flagged: false };
}

export interface StudentSearchable {
  id: string;
  regNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  classGrade: string;
  section: string;
  parentName: string;
  parentPhone: string;
}

export function filterStudentsFast<T extends StudentSearchable>(students: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return students;
  return students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const classSection = `${s.classGrade} ${s.section}`.toLowerCase();
    return (
      fullName.includes(q) ||
      s.regNo.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      classSection.includes(q) ||
      s.parentName.toLowerCase().includes(q) ||
      s.parentPhone.toLowerCase().includes(q)
    );
  });
}

export function findStudentByRollOrReg<T extends Pick<StudentSearchable, 'id' | 'regNo' | 'rollNo'>>(
  students: T[],
  code: string
): T | undefined {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return undefined;
  return students.find(
    s => s.rollNo.toLowerCase() === normalized || s.regNo.toLowerCase() === normalized
  );
}

export interface DossierMarkInput {
  studentId: string;
  marksObtained: number;
  maxMarks: number;
}

export interface DossierInvoiceInput {
  studentId: string;
  amount: number;
  paidAmount: number;
}

export function computeStudentDossierMetrics(
  studentId: string,
  marks: DossierMarkInput[],
  invoices: DossierInvoiceInput[]
): { averagePercentage: number; totalPendingFee: number; examsCount: number } {
  const studentMarks = marks.filter(m => m.studentId === studentId && m.maxMarks > 0);
  const averagePercentage =
    studentMarks.length > 0
      ? Math.round(
          (studentMarks.reduce((acc, m) => acc + (m.marksObtained / m.maxMarks) * 100, 0) /
            studentMarks.length) *
            10
        ) / 10
      : 0;

  const totalPendingFee = invoices
    .filter(inv => inv.studentId === studentId)
    .reduce((acc, inv) => acc + Math.max(0, inv.amount - (inv.paidAmount || 0)), 0);

  return {
    averagePercentage,
    totalPendingFee,
    examsCount: studentMarks.length,
  };
}

