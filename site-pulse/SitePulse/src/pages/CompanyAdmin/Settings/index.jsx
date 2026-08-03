import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave } from 'react-icons/fi';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Company Admin - Company Settings Management
 */
function CompanySettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.COMPANY}/settings`);
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`${ROUTES.COMPANY}/settings`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companySettings']);
      alert('Settings updated successfully');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      timezone: formData.get('timezone'),
      dateFormat: formData.get('dateFormat'),
      timeFormat: formData.get('timeFormat'),
      currency: formData.get('currency'),
      language: formData.get('language'),
      fiscalYearStart: formData.get('fiscalYearStart'),
      weekStartsOn: formData.get('weekStartsOn'),
      enableNotifications: formData.get('enableNotifications') === 'on',
      enableEmailNotifications: formData.get('enableEmailNotifications') === 'on',
      enableTwoFactor: formData.get('enableTwoFactor') === 'on',
      sessionTimeout: parseInt(formData.get('sessionTimeout')),
      passwordExpiryDays: parseInt(formData.get('passwordExpiryDays')),
      maxLoginAttempts: parseInt(formData.get('maxLoginAttempts')),
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
          Company Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage company-wide configuration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Localization */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Localization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <select
                name="timezone"
                defaultValue={s.timezone || 'UTC'}
                className="input"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                name="language"
                defaultValue={s.language || 'en'}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Format
              </label>
              <select
                name="dateFormat"
                defaultValue={s.dateFormat || 'MM/DD/YYYY'}
                className="input"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Format
              </label>
              <select
                name="timeFormat"
                defaultValue={s.timeFormat || '12h'}
                className="input"
              >
                <option value="12h">12 Hour (AM/PM)</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                name="currency"
                defaultValue={s.currency || 'USD'}
                className="input"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Week Starts On
              </label>
              <select
                name="weekStartsOn"
                defaultValue={s.weekStartsOn || 'Sunday'}
                className="input"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fiscal Year Start
              </label>
              <select
                name="fiscalYearStart"
                defaultValue={s.fiscalYearStart || 'January'}
                className="input"
              >
                <option value="January">January</option>
                <option value="April">April</option>
                <option value="July">July</option>
                <option value="October">October</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Security
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                name="sessionTimeout"
                defaultValue={s.sessionTimeout || 30}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password Expiry (days)
              </label>
              <input
                type="number"
                name="passwordExpiryDays"
                defaultValue={s.passwordExpiryDays || 90}
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
                defaultValue={s.maxLoginAttempts || 5}
                className="input"
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="enableTwoFactor"
                defaultChecked={s.enableTwoFactor === 'true'}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Require Two-Factor Authentication
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notifications
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="enableNotifications"
                defaultChecked={s.enableNotifications !== 'false'}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Enable In-App Notifications
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="enableEmailNotifications"
                defaultChecked={s.enableEmailNotifications !== 'false'}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Enable Email Notifications
              </label>
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

export default CompanySettingsPage;