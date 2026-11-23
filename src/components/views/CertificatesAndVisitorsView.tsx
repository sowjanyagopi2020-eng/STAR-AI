import React, { useState } from 'react';
import {
  FileBadge,
  UserCheck,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { CertificateRecord, VisitorEntry, Student } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { StarAILogo } from '../common/StarAILogo.tsx';

interface CertificatesAndVisitorsViewProps {
  certificates: CertificateRecord[];
  visitors: VisitorEntry[];
  students: Student[];
  onAddCertificate: (cert: Partial<CertificateRecord>) => Promise<any>;
  onAddVisitor: (visitor: Partial<VisitorEntry>) => Promise<any>;
  onCheckOutVisitor: (id: string) => Promise<any>;
}

export const CertificatesAndVisitorsView: React.FC<CertificatesAndVisitorsViewProps> = ({
  certificates,
  visitors,
  students,
  onAddCertificate,
  onAddVisitor,
  onCheckOutVisitor,
}) => {
  const [activeTab, setActiveTab] = useState<'certificates' | 'visitors'>('certificates');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [printableCert, setPrintableCert] = useState<CertificateRecord | null>(null);

  // Cert Form
  const [certForm, setCertForm] = useState({
    studentId: students[0]?.id || '',
    certType: 'Bonafide Certificate' as 'Transfer Certificate' | 'Bonafide Certificate' | 'Character Certificate',
    reason: 'Visa & Passport Documentation',
  });

  // Visitor Form
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    phone: '',
    purpose: 'Campus Tour & Admission Enquiry',
    personToMeet: 'Admissions Officer Chloe Sullivan',
  });

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === certForm.studentId);
    if (!st) return;

    await onAddCertificate({
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      certType: certForm.certType,
      reason: certForm.reason,
    });
    setIsCertModalOpen(false);
  };

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorForm.visitorName || !visitorForm.phone) return;
    await onAddVisitor(visitorForm);
    setIsVisitorModalOpen(false);
    setVisitorForm({
      visitorName: '',
      phone: '',
      purpose: 'Campus Tour & Admission Enquiry',
      personToMeet: 'Admissions Officer Chloe Sullivan',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Front Desk, Visitors & Certificates
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Security gate entry verification, visitor badges, and official student certificates.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'certificates'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Student Certificates
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'visitors'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Visitor Gate Passes
          </button>
        </div>
      </div>

      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Generate Bonafide Certificates and Transfer Certificates (TC) with official serial numbers.
            </p>
            <button
              onClick={() => setIsCertModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New Certificate</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Certificate No</th>
                  <th className="py-3 px-4">Certificate Type</th>
                  <th className="py-3 px-4">Scholar Name</th>
                  <th className="py-3 px-4">Reason / Purpose</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No certificates issued yet.
                    </td>
                  </tr>
                ) : (
                  certificates.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                        {c.certificateNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {c.certType}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {c.studentName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.reason}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{c.issueDate}</td>
                      <td className="py-3 px-4">
                        <Badge variant={c.status === 'Issued' ? 'success' : 'warning'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setPrintableCert(c)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'visitors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Campus Security Gate Log: Track active visitor passes and check-out timestamps.
            </p>
            <button
              onClick={() => setIsVisitorModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Gate Pass</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Pass No</th>
                  <th className="py-3 px-4">Visitor Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Person to Meet</th>
                  <th className="py-3 px-4">Check-In / Out</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitors.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                      {v.passNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {v.visitorName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{v.phone}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{v.purpose}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{v.personToMeet}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {v.checkInTime} {v.checkOutTime ? `→ ${v.checkOutTime}` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={v.status === 'Active' ? 'warning' : 'neutral'}>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.status === 'Active' ? (
                        <button
                          onClick={() => onCheckOutVisitor(v.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded transition-colors"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Certificate Modal */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Issue Official Academic Certificate"
        subtitle="Generates authenticated document with unique certificate ID"
      >
        <form onSubmit={handleCertSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Student Scholar *
            </label>
            <select
              value={certForm.studentId}
              onChange={e => setCertForm({ ...certForm, studentId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {students.length === 0 ? (
                <option value="">No students enrolled yet</option>
              ) : (
                students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.regNo} - {s.classGrade})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Certificate Category *
            </label>
            <select
              value={certForm.certType}
              onChange={e => setCertForm({ ...certForm, certType: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Bonafide Certificate">Bonafide Certificate</option>
              <option value="Transfer Certificate">Transfer Certificate (TC)</option>
              <option value="Character Certificate">Character & Conduct Certificate</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason / Stated Purpose *
            </label>
            <input
              type="text"
              required
              value={certForm.reason}
              onChange={e => setCertForm({ ...certForm, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCertModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!certForm.studentId}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg"
            >
              Issue Certificate
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Visitor Modal */}
      <Modal
        isOpen={isVisitorModalOpen}
        onClose={() => setIsVisitorModalOpen(false)}
        title="Issue Security Visitor Gate Pass"
        subtitle="Registers external campus visitor and prints barcode pass"
      >
        <form onSubmit={handleVisitorSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Visitor Full Name *
            </label>
            <input
              type="text"
              required
              value={visitorForm.visitorName}
              onChange={e => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone *
            </label>
            <input
              type="tel"
              required
              value={visitorForm.phone}
              onChange={e => setVisitorForm({ ...visitorForm, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              required
              value={visitorForm.purpose}
              onChange={e => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Person / Department to Meet *
            </label>
            <input
              type="text"
              required
              value={visitorForm.personToMeet}
              onChange={e => setVisitorForm({ ...visitorForm, personToMeet: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsVisitorModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              Grant Gate Pass
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Certificate Modal */}
      {printableCert && (
        <Modal
          isOpen={!!printableCert}
          onClose={() => setPrintableCert(null)}
          title="Print Official Certificate"
          subtitle={`Certificate Number: ${printableCert.certificateNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-8 bg-white dark:bg-slate-950 border-4 double border-amber-600/80 rounded-2xl shadow-xl space-y-6 text-center text-slate-900 dark:text-slate-100">
              <div>
                <div className="flex justify-center mb-2">
                  <StarAILogo size={60} />
                </div>
                <h3 className="text-xl font-extrabold uppercase tracking-widest text-slate-900 dark:text-white">
                  STAR AI ACADEMY
                </h3>
                <p className="text-xs text-slate-500">
                  Global Center for AI, STEM & Secondary Academic Excellence
                </p>
                <div className="mt-3 inline-block px-4 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider border border-amber-300">
                  {printableCert.certType}
                </div>
              </div>

              <div className="py-4 text-xs leading-loose font-serif max-w-xl mx-auto text-slate-700 dark:text-slate-300">
                <p>
                  This is to certify that{' '}
                  <strong className="font-sans font-bold text-slate-900 dark:text-white text-sm">
                    {printableCert.studentName}
                  </strong>{' '}
                  is a bona fide scholar of STAR AI Academy for the academic year 2026–2027.
                </p>
                <p className="mt-2">
                  This document is officially issued upon request for the stated purpose of{' '}
                  <em>"{printableCert.reason}"</em>.
                </p>
                <p className="mt-2">
                  To the best of our knowledge and official institutional records, the candidate bears exemplary conduct and moral character.
                </p>
              </div>

              <div className="pt-8 flex items-end justify-between text-xs text-slate-500 font-sans">
                <div className="text-left font-mono text-[10px]">
                  <span>Date: {printableCert.issueDate}</span>
                  <span className="block">Cert ID: {printableCert.certificateNumber}</span>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/80 flex items-center justify-center text-[9px] font-bold text-amber-600 uppercase mx-auto mb-1">
                    SEAL
                  </div>
                </div>

                <div className="text-right">
                  <div className="w-32 border-b border-slate-400 pb-1 mb-1 font-signature text-sm text-slate-800 dark:text-slate-200">
                    Dr. E. Reed
                  </div>
                  <span className="text-[10px] block">Principal's Signature</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
