import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave } from 'react-icons/fi';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Platform Owner - Settings Management
 */
function PlatformSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platformSettings'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.PLATFORM}/settings`);
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`${ROUTES.PLATFORM}/settings`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformSettings']);
      alert('Settings updated successfully');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      siteName: formData.get('siteName'),
      siteDescription: formData.get('siteDescription'),
      supportEmail: formData.get('supportEmail'),
      maxCompanies: parseInt(formData.get('maxCompanies')),
      maxUsersPerCompany: parseInt(formData.get('maxUsersPerCompany')),
      defaultTrialDays: parseInt(formData.get('defaultTrialDays')),
      allowRegistration: formData.get('allowRegistration') === 'on',
      maintenanceMode: formData.get('maintenanceMode') === 'on',
      features: {
        ai: formData.get('featureAi') === 'on',
        notifications: formData.get('featureNotifications') === 'on',
        analytics: formData.get('featureAnalytics') === 'on',
        api: formData.get('featureApi') === 'on',
      },
      email: {
        smtpHost: formData.get('smtpHost'),
        smtpPort: parseInt(formData.get('smtpPort')),
        smtpSecure: formData.get('smtpSecure') === 'on',
        smtpUser: formData.get('smtpUser'),
        fromEmail: formData.get('fromEmail'),
        fromName: formData.get('fromName'),
      },
      security: {
        passwordMinLength: parseInt(formData.get('passwordMinLength')),
        sessionTimeout: parseInt(formData.get('sessionTimeout')),
        maxLoginAttempts: parseInt(formData.get('maxLoginAttempts')),
        lockoutDuration: parseInt(formData.get('lockoutDuration')),
      },
    };

    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  const s = settings || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage platform configuration and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Name
              </label>
              <input
                type="text"
                name="siteName"
                defaultValue={s.siteName}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Support Email
              </label>
              <input
                type="email"
                name="supportEmail"
                defaultValue={s.supportEmail}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Description
              </label>
              <textarea
                name="siteDescription"
                defaultValue={s.siteDescription}
                className="input"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Companies
              </label>
              <input
                type="number"
                name="maxCompanies"
                defaultValue={s.maxCompanies}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Users Per Company
              </label>
              <input
                type="number"
                name="maxUsersPerCompany"
                defaultValue={s.maxUsersPerCompany}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Trial Days
              </label>
              <input
                type="number"
                name="defaultTrialDays"
                defaultValue={s.defaultTrialDays}
                className="input"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowRegistration"
                defaultChecked={s.allowRegistration}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Allow Public Registration
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="maintenanceMode"
                defaultChecked={s.maintenanceMode}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Maintenance Mode
              </label>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featureAi"
                defaultChecked={s.features?.ai}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                AI Features
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featureNotifications"
                defaultChecked={s.features?.notifications}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Notifications
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featureAnalytics"
                defaultChecked={s.features?.analytics}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Analytics
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featureApi"
                defaultChecked={s.features?.api}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                API Access
              </label>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Email Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                name="smtpHost"
                defaultValue={s.email?.smtpHost}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                name="smtpPort"
                defaultValue={s.email?.smtpPort}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Username
              </label>
              <input
                type="text"
                name="smtpUser"
                defaultValue={s.email?.smtpUser}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Email
              </label>
              <input
                type="email"
                name="fromEmail"
                defaultValue={s.email?.fromEmail}
                className="input"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="smtpSecure"
                defaultChecked={s.email?.smtpSecure}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Use SSL/TLS
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Security Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Password Length
              </label>
              <input
                type="number"
                name="passwordMinLength"
                defaultValue={s.security?.passwordMinLength}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                name="sessionTimeout"
                defaultValue={s.security?.sessionTimeout}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Login Attempts
              </label>
              <input
                type="number"
                name="maxLoginAttempts"
                defaultValue={s.security?.maxLoginAttempts}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                name="lockoutDuration"
                defaultValue={s.security?.lockoutDuration}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateMutation.isPending}
          >
            <FiSave className="w-5 h-5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlatformSettingsPage;