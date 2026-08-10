import { useState, useEffect } from 'react';
import { analyzeData, getRawAnalytics } from '@/services/aiService';
import { FiPieChart, FiSend, FiRefreshCw } from 'react-icons/fi';

export default function AiAnalytics() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { loadRawData(); }, []);

  async function loadRawData() {
    try {
      setLoading(true);
      const res = await getRawAnalytics();
      setRawData(res.data);
    } catch (err) { console.error('Failed to load analytics data', err); }
    finally { setLoading(false); }
  }

  async function handleAnalyze() {
    if (!query.trim() || analyzing) return;
    try {
      setAnalyzing(true);
      const res = await analyzeData({ query });
      setAnalysis(res.data.analysis);
    } catch (err) { console.error('Failed to analyze data', err); }
    finally { setAnalyzing(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <FiPieChart className="inline mr-3" /> AI Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Natural language analytics on your business data</p>
        </div>
        <button onClick={loadRawData} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ask AI About Your Business</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="e.g. What are our biggest expenses this quarter?"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleAnalyze} disabled={analyzing || !query.trim()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">
            <FiSend size={16} /> {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Analysis Result</h2>
          <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">{analysis}</pre>
        </div>
      )}

      {rawData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Company Data Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(rawData) || []).map((key) => (
              rawData[key] && typeof rawData[key] === 'object' && (
                <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{key}</h3>
                  <div className="mt-2 space-y-1">
                    {Object.entries(rawData[key]).slice(0, 5).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {typeof v === 'number' ? (typeof v === 'number' && v % 1 !== 0 ? v.toFixed(2) : v.toLocaleString()) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}