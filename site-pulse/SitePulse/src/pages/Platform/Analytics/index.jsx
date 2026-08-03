import { useQuery } from '@tanstack/react-query';
import { FiUsers, FiBuilding, FiCreditCard, FiDollarSign, FiTrendingUp, FiActivity } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-js';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Platform Owner - Analytics Dashboard
 */
function PlatformAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['platformAnalytics'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.PLATFORM}/analytics`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const planDistributionData = {
    labels: analytics?.planDistribution?.map(p => p.name) || [],
    datasets: [
      {
        label: 'Subscriptions',
        data: analytics?.planDistribution?.map(p => p._count.subscriptions) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  const planDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Platform-wide insights and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.companies?.total || 0}
              </p>
            </div>
            <FiBuilding className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+{analytics?.companies?.new || 0}</span>
            <span className="text-gray-500 ml-1">this month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Companies</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.companies?.active || 0}
              </p>
            </div>
            <FiActivity className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">
              {analytics?.companies?.total ? Math.round((analytics.companies.active / analytics.companies.total) * 100) : 0}% of total
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.users?.total || 0}
              </p>
            </div>
            <FiUsers className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+{analytics?.users?.new || 0}</span>
            <span className="text-gray-500 ml-1">this month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.subscriptions?.active || 0}
              </p>
            </div>
            <FiCreditCard className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">
              {analytics?.subscriptions?.trialing || 0} in trial
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${parseFloat(analytics?.revenue?.total || 0).toLocaleString()}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">Last 30 days</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Plans</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.planDistribution?.length || 0}
              </p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">Active pricing tiers</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Plan Distribution
          </h3>
          <div className="h-80">
            <Bar data={planDistributionData} options={planDistributionOptions} />
          </div>
        </div>

        {/* Revenue Trend (placeholder) */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Trend
          </h3>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Revenue trend chart coming soon</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Companies
          </h3>
          <div className="space-y-3">
            {analytics?.recentCompanies?.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {company.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {company._count?.users || 0} users
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    company.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {company.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Subscriptions
          </h3>
          <div className="space-y-3">
            {analytics?.recentSubscriptions?.map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {subscription.company.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subscription.plan.name} - ${subscription.plan.price}/{subscription.plan.interval.toLowerCase()}
                  </p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(subscription.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformAnalyticsPage;