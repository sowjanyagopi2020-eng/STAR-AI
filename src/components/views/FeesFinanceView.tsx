import React, { useState } from 'react';
import {
  Wallet,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  CreditCard,
  QrCode,
  Printer,
  Receipt,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FeeInvoice, PaymentTransaction, SchoolExpense } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { StarAILogo } from '../common/StarAILogo.tsx';
import { formatCurrency, calculateFeeSummary } from '../../utils/schoolMath.ts';

interface FeesFinanceViewProps {
  invoices: FeeInvoice[];
  payments: PaymentTransaction[];
  expenses: SchoolExpense[];
  onRecordPayment: (paymentData: any) => Promise<any>;
}

export const FeesFinanceView: React.FC<FeesFinanceViewProps> = ({
  invoices,
  payments,
  expenses,
  onRecordPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [printablePayment, setPrintablePayment] = useState<PaymentTransaction | null>(null);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit/Debit Card' | 'Net Banking' | 'Cash'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const summary = calculateFeeSummary(invoices);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'All') return true;
    return inv.status === statusFilter;
  });

  const handleOpenPayment = (inv: FeeInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.amount - inv.paidAmount);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsProcessing(true);
    try {
      const result = await onRecordPayment({
        invoiceId: selectedInvoice.id,
        amount: paymentAmount,
        paymentMethod,
        transactionRef: `${paymentMethod.toUpperCase()}-TXN-${Date.now().toString().slice(-8)}`,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSelectedInvoice(null);
      if (result?.payment) {
        setPrintablePayment(result.payment);
      }
    } catch (err: any) {
      console.error(`Payment failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Fees & Financial Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated billing, instant UPI gateway reconciliation, accounts payable, and receipt generation.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'invoices'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Student Invoices
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'payments'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Payment Receipts
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'expenses'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Institutional Expenses
          </button>
        </div>
      </div>

      {/* Financial Health KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total Billed Fees</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {formatCurrency(summary.totalBilled)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">AY 2026-27 Invoiced</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total Collected</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(summary.totalCollected)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {summary.collectionPercentage}% collection efficiency
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Pending Receivables</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {formatCurrency(summary.totalPending)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dues remaining</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total Operating Expenses</span>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Payroll & Infrastructure</p>
        </div>
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Filter by Status:
            </span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="All">All Invoices</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Invoices Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Student Scholar</th>
                    <th className="py-3 px-4">Fee Classification</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Paid / Balance</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No student fee invoices recorded yet. Invoices are generated automatically when you enroll a student.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const balance = inv.amount - inv.paidAmount;
                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-200">
                            {inv.invoiceNo}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {inv.studentName}
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {inv.classGrade} ({inv.section})
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {inv.feeType}
                          </td>

                          <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(inv.amount)}
                          </td>

                          <td className="py-3 px-4 font-mono tabular-nums text-xs">
                            <span className="text-emerald-600 font-medium">
                              {formatCurrency(inv.paidAmount)}
                            </span>
                            {balance > 0 && (
                              <span className="text-rose-600 block text-[11px]">
                                Due: {formatCurrency(balance)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-500">{inv.dueDate}</td>

                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                inv.status === 'Paid'
                                  ? 'success'
                                  : inv.status === 'Partial'
                                  ? 'warning'
                                  : inv.status === 'Overdue'
                                  ? 'danger'
                                  : 'neutral'
                              }
                            >
                              {inv.status}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {balance > 0 ? (
                              <button
                                onClick={() => handleOpenPayment(inv)}
                                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-2xs"
                              >
                                Collect Fee
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Settled</span>
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
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Print Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No payment receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map(pmt => (
                    <tr key={pmt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {pmt.receiptNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {pmt.studentName}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(pmt.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="primary">{pmt.paymentMethod}</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {pmt.transactionRef}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{pmt.paymentDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setPrintablePayment(pmt)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-1 ml-auto"
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

      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {exp.title}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="neutral">{exp.category}</Badge>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{exp.paidTo}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{exp.date}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={exp.status === 'Paid' ? 'success' : 'warning'}>
                      {exp.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Collect Fee Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Collect Fee: ${selectedInvoice.studentName}`}
          subtitle={`Invoice: ${selectedInvoice.invoiceNo} · Due: ${formatCurrency(selectedInvoice.amount - selectedInvoice.paidAmount)}`}
          maxWidth="md"
        >
          <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Amount ($) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={selectedInvoice.amount - selectedInvoice.paidAmount}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel / Gateway
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['UPI', 'Credit/Debit Card', 'Net Banking', 'Cash'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2.5 rounded-lg border text-left font-medium flex items-center justify-between transition-colors ${
                      paymentMethod === method
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{method}</span>
                    {paymentMethod === method && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center gap-3">
                <QrCode className="w-10 h-10 text-blue-600 shrink-0" />
                <div className="text-[11px] text-blue-800 dark:text-blue-300">
                  <p className="font-semibold">Simulated Instant UPI Payment</p>
                  <p className="font-mono text-[10px]">starai.academy@icici · Real-time auto-receipt</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
              >
                {isProcessing ? 'Verifying Gateway...' : `Confirm & Issue Receipt ($${paymentAmount})`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {printablePayment && (
        <Modal
          isOpen={!!printablePayment}
          onClose={() => setPrintablePayment(null)}
          title="Payment Settlement Receipt"
          subtitle={`Receipt: ${printablePayment.receiptNo}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700 font-sans">
                <div className="flex justify-center mb-1">
                  <StarAILogo size={40} />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  STAR AI ACADEMY
                </h4>
                <p className="text-[10px] text-slate-500">Official Fee Payment Receipt</p>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{printablePayment.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scholar Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-sans">{printablePayment.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="text-slate-700 dark:text-slate-300">{printablePayment.transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel:</span>
                  <span className="text-slate-700 dark:text-slate-300">{printablePayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-700 dark:text-slate-300">{printablePayment.paymentDate}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Amount Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(printablePayment.amount)}</span>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 font-sans">
                Computer-generated electronic receipt. No physical signature required.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
