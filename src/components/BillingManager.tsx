'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Printer, 
  Download,
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Receipt,
  FileText
} from 'lucide-react';
import axios from 'axios';
import { downloadDocument, escapeHtml } from '@/lib/document-download';

type Payment = {
  id: string;
  amount: number;
  method: string;
  transactionId: string | null;
  createdAt: string;
};

type Invoice = {
  id: string;
  amount: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  dueDate: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    mrn: string;
    email: string | null;
    phone: string | null;
  };
  payments: Payment[];
};

type BillingManagerProps = {
  userRole: string;
};

export default function BillingManager({ userRole }: BillingManagerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal View states
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  
  // Creation States
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    patientId: '',
    amount: '',
    tax: '0',
    discount: '0',
    dueDate: '',
  });

  // Collect Payment States
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CARD',
    transactionId: '',
  });

  const isStaff = ['ADMIN', 'RECEPTIONIST'].includes(userRole);
  const isPatient = userRole === 'PATIENT';

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/billing');
      setInvoices(response.data.invoices);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to retrieve billing records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreateOptions = async () => {
    if (!isStaff) return;
    try {
      const response = await axios.get('/api/patients', { params: { limit: 100 } });
      setPatients(response.data.patients);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCreateOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await axios.post('/api/billing', createForm);
      setCreateOpen(false);
      setCreateForm({
        patientId: '',
        amount: '',
        tax: '0',
        discount: '0',
        dueDate: '',
      });
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create invoice.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setPaymentForm({
      amount: invoice.total.toString(),
      method: 'CARD',
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setPaymentOpen(true);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    
    setPaymentLoading(true);
    try {
      const response = await axios.put('/api/billing', {
        invoiceId: activeInvoice.id,
        amount: paymentForm.amount,
        method: paymentForm.method,
        transactionId: paymentForm.transactionId
      });
      if (response.data.success) {
        setPaymentOpen(false);
        setActiveInvoice(null);
        fetchInvoices();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process payment receipt.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    const payments = invoice.payments.length
      ? invoice.payments.map((payment) => `<tr><td>${escapeHtml(payment.method)}</td><td>${escapeHtml(payment.transactionId || '—')}</td><td class="right">$${payment.amount.toFixed(2)}</td></tr>`).join('')
      : '<tr><td colspan="3" class="muted">No payment has been recorded.</td></tr>';
    downloadDocument(
      `medivault-invoice-${invoice.id.slice(0, 8)}.html`,
      'MediVault Invoice',
      `<h1>MediVault Clinic</h1><p class="muted">742 Health Blvd, Medical Center Hub · support@medivault.com</p><h2>Invoice · #${escapeHtml(invoice.id.slice(0, 8).toUpperCase())}</h2><div class="grid"><div><strong>Billed to</strong><br>${escapeHtml(`${invoice.patient.firstName} ${invoice.patient.lastName}`)}<br><span class="muted">MRN: ${escapeHtml(invoice.patient.mrn)}<br>${escapeHtml(invoice.patient.email || invoice.patient.phone || '')}</span></div><div><strong>Due date</strong><br>${escapeHtml(new Date(invoice.dueDate).toLocaleDateString())}<br><span class="muted">Status: ${escapeHtml(invoice.status)}</span></div></div><table><thead><tr><th>Charge</th><th class="right">Amount</th></tr></thead><tbody><tr><td>Clinical Practitioner Consultation Fee</td><td class="right">$${invoice.amount.toFixed(2)}</td></tr></tbody></table><table><tbody><tr><td>Subtotal</td><td class="right">$${invoice.amount.toFixed(2)}</td></tr><tr><td>Tax</td><td class="right">$${invoice.tax.toFixed(2)}</td></tr><tr><td>Discount</td><td class="right">-$${invoice.discount.toFixed(2)}</td></tr><tr class="total"><td>Grand total</td><td class="right">$${invoice.total.toFixed(2)}</td></tr></tbody></table><h2>Payments</h2><table><thead><tr><th>Method</th><th>Reference</th><th class="right">Amount</th></tr></thead><tbody>${payments}</tbody></table>`
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center print:hidden">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Billing & Invoices</h1>
          <p className="text-slate-500 text-xs mt-0.5">Track financial accounts, review transaction methods, and print billing receipts.</p>
        </div>

        {isStaff && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Generate Bill
          </button>
        )}
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 print:hidden">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Billing Invoices Table */}
      {loading ? (
        <div className="py-20 text-center print:hidden">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto" />
          <span className="text-slate-400 mt-2 block text-xs">Querying balance sheets...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 print:hidden">
          No billing records in your directory.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden print:hidden">
            {invoices.map((inv) => {
              const isPaid = inv.status === 'PAID';
              return (
                <article key={inv.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-mono font-bold text-xs text-slate-500">#{inv.id.slice(0, 8).toUpperCase()}</p><p className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">{inv.patient.firstName} {inv.patient.lastName}</p></div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>{inv.status}</span>
                  </div>
                  <div className="flex items-end justify-between text-xs"><div className="text-slate-500">Due {new Date(inv.dueDate).toLocaleDateString()}</div><div className="font-black text-base text-slate-950 dark:text-slate-50">${inv.total.toFixed(2)}</div></div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => setActiveInvoice(inv)} className="flex-1 min-w-28 px-3 py-2 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer">View receipt</button>
                    {isStaff && !isPaid && <button onClick={() => handleOpenPayment(inv)} className="flex-1 min-w-28 px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all cursor-pointer">Collect payment</button>}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Invoice Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-500">#{inv.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {inv.patient.firstName} {inv.patient.lastName}
                      </td>
                      <td className="p-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-bold text-slate-950 dark:text-slate-50">
                        ${inv.total.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid 
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-1">
                        <button
                          onClick={() => setActiveInvoice(inv)}
                          className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          View Receipt
                        </button>

                        {isStaff && !isPaid && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Collect Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </>
      )}

      {/* 3. Styled Receipt slip Modal with Print trigger */}
      {activeInvoice && !paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0 print:absolute print:inset-0">
          <div onClick={() => setActiveInvoice(null)} className="fixed inset-0 bg-transparent print:hidden" />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[calc(100dvh-1.5rem)] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col print:border-none print:shadow-none print:w-full print:h-full print:rounded-none">
            {/* Control Bar */}
            <div className="flex flex-wrap justify-between items-center gap-2 p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Financial Invoice Receipt</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => downloadInvoice(activeInvoice)}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => setActiveInvoice(null)}
                  className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="p-4 sm:p-8 flex-1 overflow-y-auto space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:overflow-visible print:p-0">
              {/* Header block */}
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">MediVault Clinic</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    742 Health Blvd, Medical Center Hub<br/>
                    Phone: +1 (555) 900-1200 &bull; support@medivault.com
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black uppercase tracking-widest text-emerald-600">Invoice</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">Ref: #{activeInvoice.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(activeInvoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs bg-slate-50 dark:bg-slate-950 p-4 border rounded-xl print:bg-slate-50/20">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Patient)</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{activeInvoice.patient.firstName} {activeInvoice.patient.lastName}</p>
                  <p className="text-[10px]">MRN: <span className="font-mono">{activeInvoice.patient.mrn}</span></p>
                  <p className="text-[10px]">{activeInvoice.patient.phone || 'No phone'}</p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Date</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{new Date(activeInvoice.dueDate).toLocaleDateString()}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    activeInvoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    Payment Status: {activeInvoice.status}
                  </span>
                </div>
              </div>

              {/* Line items pricing */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-widest border-b pb-2 text-slate-400 flex items-center gap-1">
                  <Receipt className="h-4 w-4 text-emerald-600" /> Itemized Charges
                </h4>

                <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 text-slate-500 font-bold">
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          Clinical Practitioner Consultation Fee
                          <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                            Visit consultations, diagnostic intake summary notes.
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold">${activeInvoice.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Breakdown totals */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>${activeInvoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Add Tax:</span>
                    <span>+${activeInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Less Discount:</span>
                    <span>-${activeInvoice.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-850/50 pt-2 font-black text-sm text-slate-950 dark:text-white">
                    <span>Grand Total:</span>
                    <span>${activeInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Transactions log list */}
              <div className="space-y-3 pt-6 border-t border-slate-200/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payments Received Logs</span>
                {activeInvoice.payments.length === 0 ? (
                  <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 border p-3 rounded-lg italic">
                    Balance Outstanding: ${activeInvoice.total.toFixed(2)} is currently unpaid.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeInvoice.payments.map((pay) => (
                      <div key={pay.id} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-950 border p-3 rounded-xl">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{pay.method} Method</span>
                          <span className="text-[10px] text-slate-400 block font-mono">TxRef: {pay.transactionId || 'N/A'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">+${pay.amount.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block">{new Date(pay.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom footer stamp */}
              <div className="pt-12 text-center border-t border-slate-200/50 mt-12 text-[10px] text-slate-400">
                <p>Thank you for choosing MediVault Clinic for your medical services.</p>
                <p className="mt-1 font-semibold uppercase tracking-wider text-emerald-600">MediVault Invoice Record</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Collect Payment Modal (Receptionist only) */}
      {paymentOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div onClick={() => setPaymentOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setPaymentOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" /> Collect Invoice Payment
            </h3>

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs space-y-1">
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Invoice Ref</span>
                <span className="font-bold font-mono">#{activeInvoice.id.toUpperCase()}</span>
                <div className="flex justify-between border-t pt-1.5 mt-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <span>Balance Due:</span>
                  <span>${activeInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Payment Amount ($ USD)</label>
                <input
                  type="number" step="0.01" required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Transaction Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CASH">Cash Collection</option>
                  <option value="INSURANCE">Insurance Claim</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Transaction Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. Card Authorization ID"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center mt-4"
              >
                {paymentLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Record Transaction Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create Invoice Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div onClick={() => setCreateOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setCreateOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" /> Create Billing Invoice
            </h3>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Select Patient</label>
                <select
                  required
                  value={createForm.patientId}
                  onChange={(e) => setCreateForm({...createForm, patientId: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Consultation Fee ($ USD)</label>
                <input
                  type="number" step="0.01" required
                  placeholder="150.00"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({...createForm, amount: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Taxes</label>
                  <input
                    type="number" step="0.01"
                    value={createForm.tax}
                    onChange={(e) => setCreateForm({...createForm, tax: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Discounts</label>
                  <input
                    type="number" step="0.01"
                    value={createForm.discount}
                    onChange={(e) => setCreateForm({...createForm, discount: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Payment Due Date</label>
                <input
                  type="date" required
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({...createForm, dueDate: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center mt-4"
              >
                {createLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Generate & Issue Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
