import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  LayoutDashboard, 
  PlusCircle, 
  Save, 
  Trash2, 
  Filter,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
  Loader2
} from 'lucide-react';
import { AuditRecord, AUDITORS, DEPARTMENTS } from './types';
import ICDSearch from './components/ICDSearch';
import Dashboard from './components/Dashboard';
import { getDiagnosticInsights, DiagnosticInsight } from './services/geminiService';
import { format } from 'date-fns';

export default function App() {
  const [view, setView] = useState<'form' | 'dashboard'>('form');
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<DiagnosticInsight | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<AuditRecord>>({
    an: '',
    dcDate: format(new Date(), 'yyyy-MM-dd'),
    sumAdjRwBefore: 0,
    sumAdjRwAfter: 0,
    auditor: AUDITORS[0],
    department: DEPARTMENTS[0],
    icd10: [],
    icd9: [],
    diagnosis: ''
  });

  // Dashboard Filters
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    department: 'All'
  });

  useEffect(() => {
    const saved = localStorage.getItem('audit_records');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const saveRecords = (newRecords: AuditRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('audit_records', JSON.stringify(newRecords));
  };

  const diff = useMemo(() => {
    return (formData.sumAdjRwAfter || 0) - (formData.sumAdjRwBefore || 0);
  }, [formData.sumAdjRwBefore, formData.sumAdjRwAfter]);

  const handleAddRecord = () => {
    if (!formData.an || !formData.dcDate) return;

    const newRecord: AuditRecord = {
      id: crypto.randomUUID(),
      an: formData.an!,
      dcDate: formData.dcDate!,
      sumAdjRwBefore: Number(formData.sumAdjRwBefore) || 0,
      sumAdjRwAfter: Number(formData.sumAdjRwAfter) || 0,
      difference: diff,
      auditor: formData.auditor!,
      department: formData.department!,
      icd10: formData.icd10 || [],
      icd9: formData.icd9 || [],
      diagnosis: formData.diagnosis || '',
      createdAt: new Date().toISOString()
    };

    saveRecords([newRecord, ...records]);
    setFormData({
      an: '',
      dcDate: format(new Date(), 'yyyy-MM-dd'),
      sumAdjRwBefore: 0,
      sumAdjRwAfter: 0,
      auditor: AUDITORS[0],
      department: DEPARTMENTS[0],
      icd10: [],
      icd9: [],
      diagnosis: ''
    });
    setInsights(null);
  };

  const toggleICD = (code: string, type: 'icd10' | 'icd9') => {
    setFormData(prev => {
      const current = prev[type] || [];
      const next = current.includes(code) 
        ? current.filter(c => c !== code)
        : [...current, code];
      return { ...prev, [type]: next };
    });
  };

  const handleGetInsights = async () => {
    if (!formData.diagnosis) return;
    setLoadingInsights(true);
    try {
      const data = await getDiagnosticInsights(
        formData.diagnosis, 
        formData.icd10 || [], 
        formData.icd9 || []
      );
      setInsights(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pastel-brown-dark px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <ClipboardList size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-accent-brown">ICD Audit Tracker</h1>
        </div>
        <div className="flex bg-pastel-brown p-1 rounded-2xl">
          <button 
            onClick={() => setView('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === 'form' ? 'bg-white shadow-sm text-accent-orange' : 'text-accent-brown/60 hover:text-accent-brown'}`}
          >
            <PlusCircle size={18} />
            Recording
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white shadow-sm text-accent-orange' : 'text-accent-brown/60 hover:text-accent-brown'}`}
          >
            <LayoutDashboard size={18} />
            Analysis
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {view === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <PlusCircle className="text-accent-orange" />
                  New Audit Record
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">AN</label>
                    <input 
                      type="text" 
                      value={formData.an}
                      onChange={e => setFormData({...formData, an: e.target.value})}
                      placeholder="Admission Number"
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">D/C Date</label>
                    <input 
                      type="date" 
                      value={formData.dcDate}
                      onChange={e => setFormData({...formData, dcDate: e.target.value})}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">SumAdjRW Before Audit</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={formData.sumAdjRwBefore}
                      onChange={e => setFormData({...formData, sumAdjRwBefore: Number(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">SumAdjRW After Audit</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={formData.sumAdjRwAfter}
                      onChange={e => setFormData({...formData, sumAdjRwAfter: Number(e.target.value)})}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2 p-4 bg-pastel-orange-light rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-accent-orange">
                        <ArrowRightLeft size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-accent-brown/60 uppercase tracking-wider">Difference</p>
                        <p className={`text-xl font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}{diff.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Auditor</label>
                    <select 
                      value={formData.auditor}
                      onChange={e => setFormData({...formData, auditor: e.target.value})}
                      className="input-field"
                    >
                      {AUDITORS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Department</label>
                    <select 
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      className="input-field"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Clinical Diagnosis</label>
                    <textarea 
                      value={formData.diagnosis}
                      onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                      placeholder="Enter clinical diagnosis details..."
                      className="input-field min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ICDSearch 
                      type="ICD10" 
                      onSelect={code => toggleICD(code, 'icd10')} 
                      selectedCodes={formData.icd10 || []} 
                    />
                    <ICDSearch 
                      type="ICD9" 
                      onSelect={code => toggleICD(code, 'icd9')} 
                      selectedCodes={formData.icd9 || []} 
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={handleAddRecord}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Save Audit Record
                  </button>
                  <button 
                    onClick={handleGetInsights}
                    disabled={loadingInsights || !formData.diagnosis}
                    className="px-6 py-2 bg-accent-brown text-white rounded-full font-medium flex items-center gap-2 hover:bg-brown-900 transition-all disabled:opacity-50"
                  >
                    {loadingInsights ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    AI Insights
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Insights & Recent */}
            <div className="space-y-6">
              {insights && (
                <div className="card p-6 bg-gradient-to-br from-orange-50 to-white border-orange-100">
                  <h3 className="text-lg font-bold text-accent-orange flex items-center gap-2 mb-4">
                    <Sparkles size={20} />
                    AI Diagnostic Insights
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-accent-brown/40 uppercase mb-1">Clinical Summary</p>
                      <p className="text-sm leading-relaxed">{insights.summary}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-accent-brown/40 uppercase mb-1">Audit Recommendations</p>
                      <ul className="space-y-2">
                        {insights.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm flex gap-2">
                            <span className="text-accent-orange font-bold">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">Recent Audits</h3>
                <div className="space-y-4">
                  {records.slice(0, 5).map(r => (
                    <div key={r.id} className="p-3 bg-pastel-brown-light rounded-xl border border-pastel-brown flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-sm">AN: {r.an}</p>
                        <p className="text-xs text-accent-brown/60">{r.department} • {format(new Date(r.dcDate), 'dd MMM')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${r.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {r.difference >= 0 ? '+' : ''}{r.difference.toFixed(2)}
                        </span>
                        <button 
                          onClick={() => saveRecords(records.filter(rec => rec.id !== r.id))}
                          className="p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && (
                    <p className="text-center text-sm text-accent-brown/40 py-8">No records yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dashboard Filters */}
            <div className="card p-6 flex flex-wrap gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent-brown/40 uppercase">Start Date</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent-brown/40 uppercase">End Date</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent-brown/40 uppercase">Department</label>
                <select 
                  value={filters.department}
                  onChange={e => setFilters({...filters, department: e.target.value})}
                  className="input-field min-w-[200px]"
                >
                  <option value="All">All Departments</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button 
                onClick={() => setFilters({
                  startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
                  endDate: format(new Date(), 'yyyy-MM-dd'),
                  department: 'All'
                })}
                className="px-4 py-2 text-sm font-medium text-accent-brown/60 hover:text-accent-brown"
              >
                Reset Filters
              </button>
            </div>

            <Dashboard records={records} filters={filters} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4 text-green-700 flex items-center gap-2">
                  <PlusCircle size={20} />
                  Potential Under-coded Cases (โรคขาด)
                </h3>
                <div className="space-y-3">
                  {records.filter(r => r.difference > 0).slice(0, 5).map(r => (
                    <div key={r.id} className="p-3 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">AN: {r.an}</p>
                        <p className="text-xs text-green-800/60">{r.department} • Diff: +{r.difference.toFixed(4)}</p>
                      </div>
                      <ChevronRight className="text-green-400" size={16} />
                    </div>
                  ))}
                  {records.filter(r => r.difference > 0).length === 0 && (
                    <p className="text-sm text-accent-brown/40 py-4 text-center">No cases found</p>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4 text-red-700 flex items-center gap-2">
                  <Trash2 size={20} />
                  Potential Over-coded Cases (โรคเกิน)
                </h3>
                <div className="space-y-3">
                  {records.filter(r => r.difference < 0).slice(0, 5).map(r => (
                    <div key={r.id} className="p-3 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">AN: {r.an}</p>
                        <p className="text-xs text-red-800/60">{r.department} • Diff: {r.difference.toFixed(4)}</p>
                      </div>
                      <ChevronRight className="text-red-400" size={16} />
                    </div>
                  ))}
                  {records.filter(r => r.difference < 0).length === 0 && (
                    <p className="text-sm text-accent-brown/40 py-4 text-center">No cases found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
