import { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiRefreshCw, FiDownload, FiTrash2 } from 'react-icons/fi';
import { generateReport, listReports, getReport, deleteReport } from '../../services/aiService';

const REPORT_TYPES = [
  { value: 'PROJECT', label: 'Project Report' },
  { value: 'FINANCE', label: 'Financial Report' },
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
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({
    type: 'CUSTOM',
    title: '',
    description: '',
    prompt: '',
    dateRange: { start: '', end: '' },
  });

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await getReports();
      setReports(res.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const handleGenerate = async () => {
    try {
      const res = await generateReport(form);
      setReports([res.data, ...reports]);
      setShowForm(false);
      setForm({ title: '', type: 'GENERAL', description: '', prompt: '' });
    } catch (err) {
      console.error('Failed to generate report', err);
    }
  };

  const handleView = async (report) => {
    try {
      const res = await getReport(report.id);
      setSelectedReport(res.data);
    } catch (err) {
      console.error('Failed to load report', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await deleteReport(id);
      setReports(reports.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete report', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Generate and manage AI-powered business reports
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Generate Report'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="PROJECT">Project Report</option>
                <option value="FINANCE">Finance Report</option>
                <option value="HR">HR Report</option>
                <option value="INVENTORY">Inventory Report</option>
                <option value="SALES">Sales Report</option>
                <option value="CUSTOM">Custom Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Report title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows="3"
                placeholder="Describe what you want to analyze..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Context
              </label>
              <textarea
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                rows={3}
                placeholder="Provide additional context for the AI analysis..."
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !formData.type}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Generated Reports</h2>
        {reports.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No reports generated yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                    report.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{report.summary}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleViewReport(report.id)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FiFileText className="mx-auto mb-4" size={48} />
            <p>No reports generated yet</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedReport.title}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              {selectedReport.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 text-gray-700 dark:text-gray-300">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
</write_to_file>