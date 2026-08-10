import { useState, useEffect } from 'react';
import { generateInsights, listInsights, markInsightRead, dismissInsight, getInsightStats } from '@/services/aiService';
import { FiBulb, FiRefreshCw, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';

const SEVERITY_COLORS = {
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AiInsights() {
  const [insights, setInsights] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadInsights(); }, []);

  async function loadInsights() {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([listInsights(), getInsightStats()]);
      setInsights(listRes.data || []);
      setStats(statsRes.data);
    } catch (err) { console.error('Failed to load insights', err); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      const res = await generateInsights();
      setInsights([...res.data, ...insights]);
      await loadInsights();
    } catch (err) { console.error('Failed to generate insights', err); }
    finally { setGenerating(false); }
  }

  async function handleRead(insightId) {
    try {
      await markInsightRead(insightId);
      setInsights(insights.map((i) => i.id === insightId ? { ...i, isRead: true } : i));
    } catch (err) { console.error('Failed to mark insight read', err); }
  }

  async function handleDismiss(insightId) {
    try {
      await dismissInsight(insightId);
      setInsights(insights.filter((i) => i.id !== insightId));
      await loadInsights();
    } catch (err) { console.error('Failed to dismiss insight', err); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <FiBulb className="inline mr-3" /> AI Insights
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Automated business insights and trend detection</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadInsights} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiRefreshCw size={16} /> Refresh
          </button>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">
            <FiBulb size={16} /> {generating ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Unread</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unread}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
            <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">High</p>
            <p className="text-2xl font-bold text-orange-500">{stats.high}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${!insight.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_COLORS[insight.severity] || SEVERITY_COLORS.INFO}`}>{insight.severity}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{insight.type}</span>
                    {insight.severity === 'CRITICAL' && <FiAlertTriangle className="text-red-500" size={16} />}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!insight.isRead && (
                    <button onClick={() => handleRead(insight.id)} className="text-blue-500 hover:text-blue-600 p-1" title="Mark as read">
                      <FiCheck size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDismiss(insight.id)} className="text-red-500 hover:text-red-600 p-1" title="Dismiss">
                    <FiX size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {new Date(insight.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {insights.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <FiBulb size={48} className="mx-auto mb-4" />
              <p>No insights yet. Click "Generate Insights" to analyze your business data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}