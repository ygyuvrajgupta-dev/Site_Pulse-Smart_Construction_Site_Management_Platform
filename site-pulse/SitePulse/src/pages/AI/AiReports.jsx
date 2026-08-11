import { useState, useEffect } from 'react';
import { generateReport, listReports, getReport, deleteReport } from '@/services/aiService';
import { FiFileText, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';

const REPORT_TYPES = [
  { value: 'PROJECT', label: 'Project Report' },
  { value: 'FINANCE', label: 'Finance Report' },
  { value: 'INVENTORY', label: 'Inventory Report' },
  { value: 'HR', label: 'HR Report' },
  { value: 'SALES', label: 'Sales Report' },
  { value: 'CUSTOM', label: 'Custom Report' },
];

export default function AiReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'CUSTOM', title: '', description: '', prompt: '', startDate: '', endDate: '' });

  async function loadReports() {
    try {
      setLoading(true);
      const res = await listReports();
      setReports(res.data || []);
    } catch (err) { console.error('Failed to load reports', err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadReports(); }, []);

  async function handleGenerate() {
    if (!form.title.trim()) return;
    try {
      setGenerating(true);
      const res = await generateReport(form);
      setReports([res.data, ...reports]);
      setShowForm(false);
      setForm({ type: 'CUSTOM', title: '', description: '', prompt: '', startDate: '', endDate: '' });
    } catch (err) { console.error('Failed to generate report', err); }
    finally { setGenerating(false); }
  }

  async function handleView(report) {
    try {
      const res = await getReport(report.id);
      setSelectedReport(res.data);
    } catch (err) { console.error('Failed to load report', err); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this report?')) return;
    try {
      await deleteReport(id);
      setReports(reports.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (err) { console.error('Failed to delete report', err); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white"><FiFileText className="inline mr-3" /> AI Reports</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Generate comprehensive business reports from your data</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadReports} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><FiRefreshCw size={16} /> Refresh</button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"><FiPlus size={16} /> {showForm ? 'Cancel' : 'Generate'}</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Generate New Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white">
                {REPORT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Report title" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Prompt</label>
              <textarea value={form.prompt || form.description} onChange={(e) => setForm({ ...form, description: e.target.value, prompt: e.target.value })} placeholder="Describe what you want the report to cover..." rows="3" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleGenerate} disabled={generating || !form.title.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 disabled:opacity-50">{generating ? 'Generating...' : 'Generate'}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{report.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.type}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleView(report)} className="text-blue-500 hover:text-blue-600 p-1"><FiFileText size={16} /></button>
                  <button onClick={() => handleDelete(report.id)} className="text-red-500 hover:text-red-600 p-1"><FiX size={16} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${report.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : report.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{report.status}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.title}</h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><FiX size={20} /></button>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">{selectedReport.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}