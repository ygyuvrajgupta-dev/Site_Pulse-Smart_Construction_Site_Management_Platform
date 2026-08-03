import { useQuery } from '@tanstack/react-query';
import { FiUsers, FiUserCheck, FiBriefcase, FiTrendingUp, FiDollarSign, FiActivity } from 'react-icons/fi';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Company Admin Dashboard.
 * Shows company-wide statistics and metrics.
 */
function CompanyAdminPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['companyDashboard'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.COMPANY}/dashboard`);
      return response.data.data;
    },
  });

  const statsCards = [
    {
      title: 'Total Users',
      value: dashboard?.users || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
    },
    {
      title: 'Employees',
      value: dashboard?.employees || 0,
      icon: FiUserCheck,
      color: 'bg-green-500',
    },
    {
      title: 'Projects',
      value: dashboard?.projects || 0,
      icon: FiBriefcase,
      color: 'bg-purple-500',
    },
    {
      title: 'Leads',
      value: dashboard?.leads || 0,
      icon: FiTrendingUp,
      color: 'bg-orange-500',
    },
    {
      title: 'Clients',
      value: dashboard?.clients || 0,
      icon: FiActivity,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Company Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of your company
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="card flex items-center gap-4">
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
            href={ROUTES.COMPANY_USERS}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiUsers className="w-8 h-8 text-secondary mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Manage Users</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage user accounts</p>
          </a>
          <a
            href={ROUTES.COMPANY_EMPLOYEES}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiUserCheck className="w-8 h-8 text-secondary mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Manage Employees</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track employee records and details</p>
          </a>
          <a
            href={ROUTES.COMPANY_ROLES}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiBriefcase className="w-8 h-8 text-secondary mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Manage Roles</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure roles and permissions</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default CompanyAdminPage;