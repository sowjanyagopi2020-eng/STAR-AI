import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStudentGrade,
  calculateAttendanceStats,
  calculateFeeSummary,
  generateRegistrationNumber,
  detectAttendanceAnomalies,
  filterStudentsFast,
  findStudentByRollOrReg,
  computeStudentDossierMetrics,
} from './schoolMath.ts';

test('calculateStudentGrade returns accurate percentage and grade brackets', () => {
  const distinction = calculateStudentGrade(95, 100);
  assert.equal(distinction.grade, 'A+');
  assert.equal(distinction.gpa, 4.0);
  assert.equal(distinction.status, 'Distinction');

  const firstClass = calculateStudentGrade(84, 100);
  assert.equal(firstClass.grade, 'A');
  assert.equal(firstClass.status, 'First Class');

  const passGrade = calculateStudentGrade(55, 100);
  assert.equal(passGrade.grade, 'C');
  assert.equal(passGrade.status, 'Pass');

  const failGrade = calculateStudentGrade(32, 100);
  assert.equal(failGrade.grade, 'F');
  assert.equal(failGrade.status, 'Fail');

  // Edge case 0 total marks
  const zeroTotal = calculateStudentGrade(0, 0);
  assert.equal(zeroTotal.grade, 'F');
});

test('calculateAttendanceStats calculates percentage and flags chronic absenteeism', () => {
  // 10 days: 8 present, 2 absent = 80% (not chronic)
  const regular = calculateAttendanceStats(['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Absent']);
  assert.equal(regular.totalSessions, 10);
  assert.equal(regular.presentCount, 8);
  assert.equal(regular.absentCount, 2);
  assert.equal(regular.percentage, 80);
  assert.equal(regular.isChronicAbsentee, false);

  // 10 days: 6 present, 4 absent = 60% (chronic < 75%)
  const chronic = calculateAttendanceStats(['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Absent', 'Absent', 'Absent']);
  assert.equal(chronic.percentage, 60);
  assert.equal(chronic.isChronicAbsentee, true);
});

test('calculateFeeSummary sums billing, collections, and dues accurately', () => {
  const invoices = [
    { id: '1', studentId: 'S1', amount: 5000, paidAmount: 5000 },
    { id: '2', studentId: 'S2', amount: 4500, paidAmount: 2000 },
    { id: '3', studentId: 'S3', amount: 6000, paidAmount: 0 },
  ];

  const summary = calculateFeeSummary(invoices);
  assert.equal(summary.totalBilled, 15500);
  assert.equal(summary.totalCollected, 7000);
  assert.equal(summary.totalPending, 8500);
  assert.equal(summary.collectionPercentage, 45.2);
});

test('generateRegistrationNumber formats standard zero-padded registration codes', () => {
  assert.equal(generateRegistrationNumber('STAR', 2026, 7), 'STAR-2026-0007');
  assert.equal(generateRegistrationNumber('STU', 2026, 142), 'STU-2026-0142');
});

test('detectAttendanceAnomalies identifies consecutive absences and excessive tardiness', () => {
  const threeAbsent = detectAttendanceAnomalies('John Doe', ['Present', 'Absent', 'Absent', 'Absent']);
  assert.equal(threeAbsent.flagged, true);
  assert.match(threeAbsent.reason!, /3 consecutive days/);

  const lateStudent = detectAttendanceAnomalies('Jane Smith', ['Late', 'Present', 'Late', 'Late', 'Present']);
  assert.equal(lateStudent.flagged, true);
  assert.match(lateStudent.reason!, /3 times in the last 5 days/);

  const goodStudent = detectAttendanceAnomalies('Alice Ray', ['Present', 'Present', 'Present', 'Present']);
  assert.equal(goodStudent.flagged, false);
});

test('filterStudentsFast and findStudentByRollOrReg locate students accurately', () => {
  const sample = [
    {
      id: 's1',
      regNo: 'STAR-2026-0001',
      rollNo: '10A-01',
      firstName: 'Ethan',
      lastName: 'Carter',
      classGrade: 'Grade 10',
      section: 'A',
      parentName: 'David Carter',
      parentPhone: '555-234-5678',
    },
    {
      id: 's2',
      regNo: 'STAR-2026-0002',
      rollNo: '10A-02',
      firstName: 'Aaliyah',
      lastName: 'Patel',
      classGrade: 'Grade 10',
      section: 'A',
      parentName: 'Rajesh Patel',
      parentPhone: '555-345-6789',
    },
  ];

  assert.equal(filterStudentsFast(sample, 'aaliyah').length, 1);
  assert.equal(filterStudentsFast(sample, 'Rajesh').length, 1);
  assert.equal(filterStudentsFast(sample, '10A-01')[0].id, 's1');
  assert.equal(findStudentByRollOrReg(sample, ' 10a-02 ')?.id, 's2');
  assert.equal(findStudentByRollOrReg(sample, 'STAR-2026-0001')?.id, 's1');
  assert.equal(findStudentByRollOrReg(sample, '99Z-99'), undefined);
});

test('computeStudentDossierMetrics computes average mark percentage and pending fees', () => {
  const dossier = computeStudentDossierMetrics(
    'stu-1',
    [
      { studentId: 'stu-1', marksObtained: 90, maxMarks: 100 },
      { studentId: 'stu-1', marksObtained: 80, maxMarks: 100 },
      { studentId: 'stu-2', marksObtained: 50, maxMarks: 100 },
    ],
    [
      { studentId: 'stu-1', amount: 3500, paidAmount: 2000 },
      { studentId: 'stu-1', amount: 500, paidAmount: 500 },
    ]
  );

  assert.equal(dossier.averagePercentage, 85);
  assert.equal(dossier.totalPendingFee, 1500);
  assert.equal(dossier.examsCount, 2);
});

