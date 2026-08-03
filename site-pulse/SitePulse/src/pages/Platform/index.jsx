import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiUsers, FiBuilding, FiCreditCard, FiDollarSign, FiTrendingUp, FiActivity } from 'react-icons/fi';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Platform Owner Dashboard.
 * Shows platform-wide statistics and metrics.
 */
function PlatformPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.PLATFORM}/stats`);
      return response.data.data;
    },
  });

  const statsCards = [
    {
      title: 'Total Companies',
      value: stats?.totalCompanies || 0,
      icon: FiBuilding,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Companies',
      value: stats?.activeCompanies || 0,
      icon: FiActivity,
      color: 'bg-green-500',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      color: 'bg-purple-500',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: FiCreditCard,
      color: 'bg-orange-500',
    },
    {
      title: 'Total Plans',
      value: stats?.totalPlans || 0,
      icon: FiTrendingUp,
      color: 'bg-indigo-500',
    },
    {
      title: 'Total Revenue',
      value: `$${parseFloat(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of your entire platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="card flex items-center gap-4"
          >
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={ROUTES.PLATFORM_COMPANIES}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiBuilding className="w-8 h-8 text-secondary mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Manage Companies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create, suspend, or activate companies</p>
          </a>
          <a
            href={ROUTES.PLATFORM_PLANS}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiCreditCard className="w-8 h-8 text-secondary mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Manage Plans</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create and update subscription plans</p>
          </a>
          <a
            href={ROUTES.PLATFORM_ANALYTICS}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiTrendingUp className="w-8 h-8 text-secondary mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">View Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Platform-wide insights and metrics</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default PlatformPage;