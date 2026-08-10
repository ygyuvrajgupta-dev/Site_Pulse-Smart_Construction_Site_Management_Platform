import { useState, useEffect } from 'react';
import { generateSuggestions, listSuggestions, markSuggestionApplied, dismissSuggestion, getSuggestionStats } from '@/services/aiService';
import { FiThumbsUp, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';

export default function AiSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadSuggestions(); }, []);

  async function loadSuggestions() {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([listSuggestions(), getSuggestionStats()]);
      setSuggestions(listRes.data || []);
      setStats(statsRes.data);
    } catch (err) { console.error('Failed to load suggestions', err); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      const res = await generateSuggestions();
      setSuggestions([...res.data, ...suggestions]);
      await loadSuggestions();
    } catch (err) { console.error('Failed to generate suggestions', err); }
    finally { setGenerating(false); }
  }

  async function handleApply(id) {
    try {
      await markSuggestionApplied(id);
      setSuggestions(suggestions.map((s) => s.id === id ? { ...s, isApplied: true } : s));
      await loadSuggestions();
    } catch (err) { console.error('Failed to apply suggestion', err); }
  }

  async function handleDismiss(id) {
    try {
      await dismissSuggestion(id);
      setSuggestions(suggestions.filter((s) => s.id !== id));
      await loadSuggestions();
    } catch (err) { console.error('Failed to dismiss suggestion', err); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <FiThumbsUp className="inline mr-3" /> AI Suggestions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Actionable recommendations for business improvement</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSuggestions} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiRefreshCw size={16} /> Refresh
          </button>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">
            <FiThumbsUp size={16} /> {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Applied</p>
            <p className="text-2xl font-bold text-green-500">{stats.applied}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${suggestion.isApplied ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{suggestion.type}</span>
                    {suggestion.isApplied && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Applied</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{suggestion.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{suggestion.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!suggestion.isApplied && (
                    <button onClick={() => handleApply(suggestion.id)} className="text-green-500 hover:text-green-600 p-1" title="Apply">
                      <FiCheck size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDismiss(suggestion.id)} className="text-red-500 hover:text-red-600 p-1" title="Dismiss">
                    <FiX size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {new Date(suggestion.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {suggestions.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <FiThumbsUp size={48} className="mx-auto mb-4" />
              <p>No suggestions yet. Click "Generate" to get recommendations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}