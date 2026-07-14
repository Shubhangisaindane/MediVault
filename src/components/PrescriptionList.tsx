'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Printer, 
  Download,
  X, 
  Loader2, 
  AlertCircle,
  Activity,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { downloadDocument, escapeHtml } from '@/lib/document-download';

type PrescriptionItem = {
  id: string;
  medicine: {
    name: string;
    category: string | null;
  };
  dosage: string;
  frequency: string;
  duration: string;
};

type Prescription = {
  id: string;
  createdAt: string;
  instructions: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
    dateOfBirth: string;
    sex: string;
  };
  doctor: {
    firstName: string;
    lastName: string;
    specialization: string;
    department: string;
  };
  items: PrescriptionItem[];
};

type MedicineOption = {
  id: string;
  name: string;
  stock: number;
};

type PrescriptionListProps = {
  userRole: string;
};

export default function PrescriptionList({ userRole }: PrescriptionListProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<MedicineOption[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal View states
  const [activePresc, setActivePresc] = useState<Prescription | null>(null);
  
  // Writer states (Doctors only)
  const [writerOpen, setWriterOpen] = useState(false);
  const [writerLoading, setWriterLoading] = useState(false);
  const [writerError, setWriterError] = useState<string | null>(null);
  const [writerSuccess, setWriterSuccess] = useState<string | null>(null);

  const [targetPatientId, setTargetPatientId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState<Array<{ medicineId: string; dosage: string; frequency: string; duration: string }>>([
    { medicineId: '', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' }
  ]);

  const isDoctor = userRole === 'DOCTOR';
  const isPatient = userRole === 'PATIENT';

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/prescriptions');
      setPrescriptions(response.data.prescriptions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch prescriptions folder.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWriterOptions = async () => {
    if (!isDoctor) return;
    try {
      const medRes = await axios.get('/api/medicines');
      setMedicines(medRes.data.medicines);

      const patRes = await axios.get('/api/patients', { params: { limit: 100 } });
      setPatients(patRes.data.patients);
    } catch (err) {
      console.error('Failed to load pharmacy options:', err);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchWriterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddItem = () => {
    setItems(prev => [...prev, { medicineId: '', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleWritePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setWriterLoading(true);
    setWriterError(null);
    setWriterSuccess(null);

    // Validate medicines are chosen
    if (items.some(item => !item.medicineId)) {
      setWriterError('Please select a medicine for all prescription lines.');
      setWriterLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/prescriptions', {
        patientId: targetPatientId,
        instructions,
        items
      });
      if (response.data.success) {
        setWriterSuccess('Prescription generated & pharmacy stock adjusted.');
        setTargetPatientId('');
        setInstructions('');
        setItems([{ medicineId: '', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' }]);
        fetchPrescriptions();
        setTimeout(() => {
          setWriterOpen(false);
          setWriterSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setWriterError(err.response?.data?.error || 'Failed to submit prescription.');
    } finally {
      setWriterLoading(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const downloadPrescription = (prescription: Prescription) => {
    const items = prescription.items.map((item) => `
      <tr><td><strong>${escapeHtml(item.medicine.name)}</strong><div class="muted">${escapeHtml(item.medicine.category || 'General Pharma')}</div></td><td>${escapeHtml(item.dosage)}</td><td>${escapeHtml(item.frequency)}</td><td>${escapeHtml(item.duration)}</td></tr>`).join('');
    downloadDocument(
      `medivault-prescription-${prescription.id.slice(0, 8)}.html`,
      'MediVault Prescription',
      `<h1>MediVault Clinic</h1><p class="muted">742 Health Blvd, Medical Center Hub · support@medivault.com</p><h2>Prescription · #${escapeHtml(prescription.id.slice(0, 8).toUpperCase())}</h2><div class="grid"><div><strong>Patient</strong><br>${escapeHtml(`${prescription.patient.firstName} ${prescription.patient.lastName}`)}<br><span class="muted">MRN: ${escapeHtml(prescription.patient.mrn)}</span></div><div><strong>Prescribing physician</strong><br>Dr. ${escapeHtml(`${prescription.doctor.firstName} ${prescription.doctor.lastName}`)}<br><span class="muted">${escapeHtml(prescription.doctor.specialization)}</span></div></div><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>${items}</tbody></table>${prescription.instructions ? `<h2>Instructions</h2><p>${escapeHtml(prescription.instructions)}</p>` : ''}<p class="muted">Issued ${escapeHtml(new Date(prescription.createdAt).toLocaleDateString())}</p>`
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center print:hidden">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Prescriptions Folder</h1>
          <p className="text-slate-500 text-xs mt-0.5">Explore pharmacy records, dosage frequencies, and export prescription sheets.</p>
        </div>

        {isDoctor && (
          <button
            onClick={() => setWriterOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Write Prescription
          </button>
        )}
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 print:hidden">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Roster List */}
      {loading ? (
        <div className="py-20 text-center print:hidden">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto" />
          <span className="text-slate-400 mt-2 block text-xs">Querying pharmacy directory...</span>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 print:hidden">
          No prescriptions found in your health record.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
          {prescriptions.map((presc) => (
            <div 
              key={presc.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Prescribed Date</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {new Date(presc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 rounded-full">
                    {presc.items.length} Medicines
                  </span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-3 text-xs space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {isPatient ? `Dr. ${presc.doctor.firstName} ${presc.doctor.lastName}` : `Patient: ${presc.patient.firstName} ${presc.patient.lastName}`}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    {isPatient ? presc.doctor.specialization : `MRN: ${presc.patient.mrn}`}
                  </p>
                  <div className="pt-2 space-y-1">
                    {presc.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        <span>{item.medicine.name}</span>
                        <span>{item.dosage}</span>
                      </div>
                    ))}
                    {presc.items.length > 2 && (
                      <span className="text-[10px] text-slate-400 italic block pt-1">
                        + {presc.items.length - 2} more drugs...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-4 flex justify-end">
                <button
                  onClick={() => setActivePresc(presc)}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  View Rx Slip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Detailed slip modal with print triggers */}
      {activePresc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0 print:absolute print:inset-0">
          <div onClick={() => setActivePresc(null)} className="fixed inset-0 bg-transparent print:hidden" />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[calc(100dvh-1.5rem)] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col print:border-none print:shadow-none print:w-full print:h-full print:rounded-none">
            {/* Modal Controls */}
            <div className="flex flex-wrap justify-between items-center gap-2 p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prescription Sheet</span>
              <div className="flex gap-2">
                <button
                  onClick={triggerPrint}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => downloadPrescription(activePresc)}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => setActivePresc(null)}
                  className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-4 sm:p-8 flex-1 overflow-y-auto space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:overflow-visible print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
                      M
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">MediVault Clinic</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    742 Health Blvd, Medical Center Hub<br/>
                    Phone: +1 (555) 900-1200 &bull; Fax: +1 (555) 900-1201<br/>
                    support@medivault.com
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black uppercase tracking-widest text-emerald-600">Prescription</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">Rx Ref: #{activePresc.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(activePresc.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Patient & Doctor Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs bg-slate-50 dark:bg-slate-950 p-4 border rounded-xl print:bg-slate-50/20">
                <div className="space-y-1 sm:border-r border-slate-200/50 dark:border-slate-800/50 sm:pr-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Folder</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{activePresc.patient.firstName} {activePresc.patient.lastName}</p>
                  <p className="text-[10px]">MRN: <span className="font-mono">{activePresc.patient.mrn}</span></p>
                  <p className="text-[10px]">DOB: {new Date(activePresc.patient.dateOfBirth).toLocaleDateString()} &bull; Sex: {activePresc.patient.sex}</p>
                </div>
                <div className="space-y-1 pl-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescribing Physician</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Dr. {activePresc.doctor.firstName} {activePresc.doctor.lastName}</p>
                  <p className="text-[10px]">{activePresc.doctor.specialization}</p>
                  <p className="text-[10px]">{activePresc.doctor.department}</p>
                </div>
              </div>

              {/* Drugs list */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-widest border-b pb-2 text-slate-400 flex items-center gap-1">
                  <Activity className="h-4 w-4 text-emerald-600" /> Prescribed Rx Items
                </h4>

                <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 text-slate-500 font-bold">
                        <th className="p-3">Medicine / Category</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {activePresc.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {item.medicine.name}
                            <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                              {item.medicine.category || 'General Pharma'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{item.dosage}</td>
                          <td className="p-3">{item.frequency}</td>
                          <td className="p-3 font-medium text-slate-500">{item.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special instructions */}
              {activePresc.instructions && (
                <div className="space-y-1.5 border-t border-slate-200/50 pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Clinical Directions / Instructions</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border italic">
                    &quot;{activePresc.instructions}&quot;
                  </p>
                </div>
              )}

              {/* Bottom signature line */}
              <div className="pt-12 flex justify-between items-end border-t border-slate-200/50 mt-12">
                <p className="text-[9px] text-slate-400 max-w-xs leading-normal">
                  Important: Please present this slip along with your health card at the pharmacy desk to redeem your medicines.
                </p>
                <div className="text-center w-48 border-t border-slate-300 dark:border-slate-800 pt-2 space-y-1">
                  <span className="text-[10px] font-bold block text-slate-800 dark:text-slate-200">
                    Dr. {activePresc.doctor.firstName} {activePresc.doctor.lastName}
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Authorized Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Prescription Writer Modal (Doctors only) */}
      {writerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div onClick={() => setWriterOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button onClick={() => setWriterOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" /> Write Pharmacy Prescription
            </h3>

            {writerError && (
              <div className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{writerError}</span>
              </div>
            )}

            {writerSuccess && (
              <div className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{writerSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWritePrescription} className="space-y-4">
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Select Patient Profile</label>
                <select
                  required
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
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

              {/* Dynamic drug list lines */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase">Prescribed Drug Lines</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    + Add Drug
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-2 relative">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400">Medicine</label>
                          <select
                            required
                            value={item.medicineId}
                            onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                            className="w-full border px-2 py-1 rounded-md text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="">-- Select Drug --</option>
                            {medicines.map(m => (
                              <option key={m.id} value={m.id} disabled={m.stock < 1}>
                                {m.name} {m.stock < 1 ? '(OUT OF STOCK)' : `(${m.stock} in stock)`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400">Dosage</label>
                          <input
                            type="text" required
                            value={item.dosage}
                            placeholder="e.g. 500mg"
                            onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                            className="w-full border px-2 py-1 rounded-md text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400">Frequency</label>
                          <input
                            type="text" required
                            value={item.frequency}
                            placeholder="e.g. Twice daily"
                            onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                            className="w-full border px-2 py-1 rounded-md text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400">Duration</label>
                          <input
                            type="text" required
                            value={item.duration}
                            placeholder="e.g. 7 days"
                            onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                            className="w-full border px-2 py-1 rounded-md text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Special Instructions / Directions</label>
                <textarea
                  placeholder="Take after meals, avoid alcohol..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 h-20"
                />
              </div>

              <button
                type="submit"
                disabled={writerLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center mt-4"
              >
                {writerLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Log & Authorize Prescription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
