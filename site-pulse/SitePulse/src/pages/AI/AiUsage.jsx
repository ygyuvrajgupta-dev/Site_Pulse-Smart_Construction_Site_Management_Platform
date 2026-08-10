import { useState, useEffect } from 'react';
import { getAiUsage, getAiUsageByFeature } from '@/services/aiService';
import { FiActivity } from 'react-icons/fi';

export default function AiUsage() {
  const [usage, setUsage] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadUsage(); }, []);

  async function loadUsage() {
    try {
      setLoading(true);
      const [usageRes, featuresRes] = await Promise.all([getAiUsage(), getAiUsageByFeature()]);
      setUsage(usageRes.data);
      setFeatures(featuresRes.data || []);
    } catch (err) { console.error('Failed to load usage', err); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <FiActivity className="inline mr-3" /> AI Usage
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor your AI usage and quotas</p>
        </div>
        <button onClick={loadUsage} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          Refresh
        </button>
      </div>

      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Calls</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{usage.totalCalls || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{(usage.totalTokens || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{(usage.successRate || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">${(usage.totalCost || 0).toFixed(4)}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Usage by Feature</h2>
        </div>
        {features.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No feature usage data yet</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {features.map((feature) => (
              <div key={feature.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{feature.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.provider} - {feature.modelName || 'default'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {feature.usedThisMonth || 0} / {feature.monthlyLimit || '∞'} calls
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${feature.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {feature.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}