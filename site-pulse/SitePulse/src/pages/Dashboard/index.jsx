import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiActivity,
  FiFileText,
  FiImage,
  FiLogOut,
  FiMessageSquare,
  FiPieChart,
  FiThumbsUp,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';

const AI_CARDS = [
  { title: 'AI Chat', description: 'Conversational assistant for business queries', icon: FiMessageSquare, path: ROUTES.AI_CHAT, color: 'bg-blue-500' },
  { title: 'AI Reports', description: 'Generate reports from your live data', icon: FiFileText, path: ROUTES.AI_REPORTS, color: 'bg-green-500' },
  { title: 'AI OCR', description: 'Extract text and data from documents', icon: FiImage, path: ROUTES.AI_OCR, color: 'bg-purple-500' },
  { title: 'AI Analytics', description: 'Natural language analytics on business data', icon: FiPieChart, path: ROUTES.AI_ANALYTICS, color: 'bg-orange-500' },
  { title: 'AI Insights', description: 'Automated insights and trend detection', icon: FiZap, path: ROUTES.AI_INSIGHTS, color: 'bg-yellow-500' },
  { title: 'AI Suggestions', description: 'Actionable recommendations to improve your business', icon: FiThumbsUp, path: ROUTES.AI_SUGGESTIONS, color: 'bg-indigo-500' },
];

/**
 * Dashboard Page.
 * Landing screen for authenticated users with quick access to AI features.
 */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ROUTES.HOME);
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || user?.email || 'there'}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Here is a snapshot of what Site Pulse can do for you today.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FiLogOut size={16} />
          Sign out
        </button>
      </div>

      {/* Demo callout */}
      {user?.demo && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
          You are in <strong>demo mode</strong> — your AI queries will show sample
          behavior until you register with valid credentials and a real company.
        </div>
      )}

      {/* AI overview link */}
      <Link
        to={ROUTES.AI}
        className="group flex items-center justify-between p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <FiActivity size={22} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">AI Overview</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Check provider status, usage, and quotas across all six AI features.
            </p>
          </div>
        </div>
        <FiArrowRight className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
      </Link>

      {/* AI feature cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {AI_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.path}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className={`p-3 rounded-lg ${card.color} text-white w-fit`}>
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{card.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}