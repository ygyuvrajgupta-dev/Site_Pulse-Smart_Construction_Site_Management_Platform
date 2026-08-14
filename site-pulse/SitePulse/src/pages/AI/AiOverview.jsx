
import { useState, useEffect } from 'react';
import { getAiStatus, getAiUsage, getInsightStats, getSuggestionStats } from '@/services/aiService';
import { FiCpu, FiMessageSquare, FiFileText, FiImage, FiPieChart, FiZap, FiThumbsUp, FiCheckCircle, FiX } from 'react-icons/fi';

export default function AiOverview() {
  const [status, setStatus] = useState(null);
  const [usage, setUsage] = useState(null);
  const [insightStats, setInsightStats] = useState(null);
  const [suggestionStats, setSuggestionStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
    try {
      const [statusData, usageData, iStats, sStats] = await Promise.all([
        getAiStatus(),
        getAiUsage(),
        getInsightStats(),
        getSuggestionStats(),
      ]);
      setStatus(statusData.data);
      setUsage(usageData.data);
      setInsightStats(iStats.data);
      setSuggestionStats(sStats.data);
      } catch (err) {
        console.error('Failed to load AI data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featureCards = [
    {
      title: 'AI Chat',
      description: 'Intelligent conversational assistant for business queries',
      icon: FiMessageSquare,
      path: '/ai/chat',
      color: 'bg-blue-500',
    },
    {
      title: 'AI Reports',
      description: 'Generate comprehensive business reports from your data',
      icon: FiFileText,
      path: '/ai/reports',
      color: 'bg-green-500',
    },
    {
      title: 'AI OCR',
      description: 'Extract text and data from documents using AI',
      icon: FiImage,
      path: '/ai/ocr',
      color: 'bg-purple-500',
    },
    {
      title: 'AI Analytics',
      description: 'Natural language analytics on your business data',
      icon: FiPieChart,
      path: '/ai/analytics',
      color: 'bg-orange-500',
    },
    {
      title: 'AI Insights',
      description: 'Automated business insights and trend detection',
      icon: FiZap,
      path: '/ai/insights',
      color: 'bg-yellow-500',
    },
    {
      title: 'AI Suggestions',
      description: 'Actionable recommendations for business improvement',
      icon: FiThumbsUp,
      path: '/ai/suggestions',
      color: 'bg-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          <FiCpu className="inline mr-3" />
          AI Features
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Leverage AI to automate tasks, generate insights, and improve productivity
        </p>
      </div>

      {/* AI Status Banner */}
      <div className={`p-4 rounded-lg mb-8 ${status?.configured ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
        <div className="flex items-center">
          {status?.configured ? (
            <FiCheckCircle className="text-green-500 mr-3" size={24} />
          ) : (
            <FiX className="text-yellow-500 mr-3" size={24} />
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              AI System: {status?.configured ? 'Configured' : 'Not Configured'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status?.configured
                ? `Providers: ${status?.providers?.join(', ') || 'None'}`
                : 'Set up your API keys in the environment configuration to enable AI features'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {featureCards.map((feature) => (
          <a
            key={feature.title}
            href={feature.path}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-lg ${feature.color} text-white`}>
                <feature.icon size={24} />
              </div>
              <h3 className="ml-3 font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
          </a>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total AI Calls</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {usage?.totalCalls || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tokens</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {(usage?.totalTokens || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Insights</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {insightStats?.total || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Suggestions</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {suggestionStats?.total || 0}
          </p>
        </div>
      </div>
    </div>
  );
}