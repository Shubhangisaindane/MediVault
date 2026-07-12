'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Download, 
  Plus, 
  UserPlus, 
  FileSpreadsheet, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Info,
  Calendar,
  X,
  Heart,
  Thermometer,
  Scale
} from 'lucide-react';
import axios from 'axios';

type PatientDirectoryProps = {
  userRole: string;
};

export default function PatientDirectory({ userRole }: PatientDirectoryProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query States
  const [search, setSearch] = useState('');
  const [sex, setSex] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: 'Female',
    phone: '',
    email: '',
    address: '',
  });

  // History Panel / Detailed View
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyVisits, setHistoryVisits] = useState<any[]>([]);

  const isStaff = ['ADMIN', 'RECEPTIONIST'].includes(userRole);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/patients', {
        params: {
          search,
          sex,
          sortBy,
          sortOrder,
          page,
          limit: 10,
        }
      });
      setPatients(response.data.patients);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to retrieve patients roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sex, sortBy, sortOrder, page]);

  // Handle Sort Change
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Bulk select toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(patients.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Patients
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} patient profiles? This action soft-deletes records.`)) {
      return;
    }
    try {
      await axios.delete('/api/patients', { data: { ids: selectedIds } });
      setSelectedIds([]);
      fetchPatients();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete bulk delete.');
    }
  };

  // Export to CSV
  const handleCSVExport = () => {
    if (patients.length === 0) return;
    
    // Header
    const headers = ['MRN', 'First Name', 'Last Name', 'DOB', 'Sex', 'Phone', 'Email', 'Address'];
    const rows = patients.map(p => [
      p.mrn,
      p.firstName,
      p.lastName,
      p.dateOfBirth.split('T')[0],
      p.sex,
      p.phone || '',
      p.email || '',
      p.address || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medivault_patient_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create Patient Submission
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await axios.post('/api/patients', createForm);
      setCreateOpen(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        sex: 'Female',
        phone: '',
        email: '',
        address: '',
      });
      fetchPatients();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create patient profile.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Fetch individual history
  const openHistoryPanel = async (patient: any) => {
    setSelectedPatient(patient);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryVisits([]);

    try {
      // In a production app, we would make a dedicated patient visits endpoint.
      // For this trial, we'll fetch visits linked to this patient.
      const response = await axios.get(`/api/visits?patientId=${patient.id}`);
      setHistoryVisits(response.data.visits);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Patient Directory</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage EHR demographic records, search diagnostics, or add intake admissions.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCSVExport}
            disabled={patients.length === 0}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export CSV
          </button>

          {isStaff && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Add Patient Intake
            </button>
          )}
        </div>
      </div>

      {/* 2. Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="relative col-span-2">
          <Search className="absolute left-3 inset-y-0 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by MRN, name, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <select
            value={sex}
            onChange={(e) => { setSex(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          >
            <option value="">All Genders</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* 3. Bulk delete action notice */}
      {selectedIds.length > 0 && isStaff && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 p-4 rounded-xl">
          <span className="text-xs font-bold text-rose-800 dark:text-rose-400">
            {selectedIds.length} profiles selected for deletion.
          </span>
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selection
          </button>
        </div>
      )}

      {/* 4. Table card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                {isStaff && (
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={patients.length > 0 && selectedIds.length === patients.length}
                      className="rounded accent-emerald-600 h-4 w-4"
                    />
                  </th>
                )}
                <th onClick={() => handleSort('mrn')} className="p-4 font-semibold cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    MRN
                    {sortBy === 'mrn' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </div>
                </th>
                <th onClick={() => handleSort('lastName')} className="p-4 font-semibold cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Name
                    {sortBy === 'lastName' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </div>
                </th>
                <th onClick={() => handleSort('dateOfBirth')} className="p-4 font-semibold cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Date of Birth
                    {sortBy === 'dateOfBirth' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </div>
                </th>
                <th className="p-4 font-semibold">Gender</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Last Visit Diagnosis</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Loader2 className="animate-spin h-6 w-6 text-emerald-600 mx-auto" />
                    <span className="text-slate-400 mt-2 block">Loading patients records...</span>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No patient records found matching your filters.
                  </td>
                </tr>
              ) : (
                patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    {isStaff && (
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(pat.id)}
                          onChange={() => handleSelectRow(pat.id)}
                          className="rounded accent-emerald-600 h-4 w-4"
                        />
                      </td>
                    )}
                    <td className="p-4 font-mono font-bold text-slate-500">{pat.mrn}</td>
                    <td className="p-4 font-bold text-slate-950 dark:text-slate-50">
                      {pat.firstName} {pat.lastName}
                    </td>
                    <td className="p-4">{new Date(pat.dateOfBirth).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pat.sex === 'Female' 
                          ? 'bg-rose-500/10 text-rose-600' 
                          : pat.sex === 'Male' 
                          ? 'bg-blue-500/10 text-blue-600' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {pat.sex}
                      </span>
                    </td>
                    <td className="p-4">{pat.phone || 'N/A'}</td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {pat.visits?.[0]?.diagnosis || 'General Intake'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openHistoryPanel(pat)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                        title="View Medical Folder"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4">
          <span className="text-slate-500 text-[11px]">
            Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} patient files
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Create Patient Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div onClick={() => setCreateOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setCreateOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" /> Register Patient Intake Profile
            </h3>
            
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">First Name</label>
                  <input
                    type="text" required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Last Name</label>
                  <input
                    type="text" required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Date of Birth</label>
                  <input
                    type="date" required
                    value={createForm.dateOfBirth}
                    onChange={(e) => setCreateForm({...createForm, dateOfBirth: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Gender</label>
                  <select
                    value={createForm.sex}
                    onChange={(e) => setCreateForm({...createForm, sex: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Email</label>
                <input
                  type="email"
                  placeholder="patient@medivault.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Address</label>
                <input
                  type="text"
                  placeholder="Address details"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center"
              >
                {createLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Register Patient Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Medical Folder History Drawer Panel */}
      {historyOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop mask */}
          <div onClick={() => setHistoryOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          {/* Panel drawer sheet */}
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 shadow-2xl relative z-10 overflow-y-auto animate-in slide-in-from-right duration-300">
            <button onClick={() => setHistoryOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Patient Medical Folder
            </h3>

            {/* Demographics Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl space-y-3 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">MRN: {selectedPatient.mrn}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded">
                  {selectedPatient.sex}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div>DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</div>
                <div>Phone: {selectedPatient.phone || 'N/A'}</div>
                <div className="col-span-2">Email: {selectedPatient.email || 'N/A'}</div>
                <div className="col-span-2">Address: {selectedPatient.address || 'N/A'}</div>
              </div>
            </div>

            {/* Vitals History List */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm">Consultation Summaries & Vitals Logs</h4>

              {historyLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin h-6 w-6 text-emerald-600 mx-auto" />
                  <span className="text-xs text-slate-400 mt-2 block">Retrieving medical timeline...</span>
                </div>
              ) : historyVisits.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 border border-dashed rounded-xl">
                  No visits summarized for this patient file yet.
                </p>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                  {historyVisits.map((visit) => (
                    <div key={visit.id} className="pl-8 relative">
                      {/* Timeline dot */}
                      <span className="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900 border border-white" />
                      
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 border rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{new Date(visit.visitDate).toLocaleString()}</span>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              Dr. {visit.doctor.firstName} {visit.doctor.lastName}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {visit.diagnosis || 'General checkup'}
                          </span>
                        </div>

                        {/* Vitals badge block */}
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border text-center">
                            <span className="text-slate-400 block font-semibold">BP</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {visit.bloodPressureSystolic || '--'}/{visit.bloodPressureDiastolic || '--'}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border text-center">
                            <span className="text-slate-400 block font-semibold">Pulse</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{visit.heartRate || '--'} bpm</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border text-center">
                            <span className="text-slate-400 block font-semibold">Temp</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{visit.temperatureC || '--'} °C</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 italic bg-white dark:bg-slate-900 border p-2 rounded-lg leading-relaxed">
                          &quot;{visit.notes}&quot;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
