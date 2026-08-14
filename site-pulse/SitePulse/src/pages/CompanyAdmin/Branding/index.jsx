import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiDroplet, FiRefreshCw } from 'react-icons/fi';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Company Admin - Branding Management
 */
function CompanyBrandingPage() {
  const queryClient = useQueryClient();

  const { data: branding, isLoading } = useQuery({
    queryKey: ['companyBranding'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.COMPANY}/branding`);
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`${ROUTES.COMPANY}/branding`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyBranding']);
      alert('Branding updated successfully');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`${ROUTES.COMPANY}/branding`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyBranding']);
      alert('Branding reset to defaults');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      primaryColor: formData.get('primaryColor'),
      secondaryColor: formData.get('secondaryColor'),
      accentColor: formData.get('accentColor'),
      backgroundColor: formData.get('backgroundColor'),
      textColor: formData.get('textColor'),
      logoUrl: formData.get('logoUrl'),
      faviconUrl: formData.get('faviconUrl'),
      companyName: formData.get('companyName'),
      tagline: formData.get('tagline'),
      customCss: formData.get('customCss'),
      emailTemplate: formData.get('emailTemplate'),
      loginPageStyle: formData.get('loginPageStyle'),
      sidebarStyle: formData.get('sidebarStyle'),
    };
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading branding settings...</div>;
  }

  const b = branding || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Branding
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your company branding
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Reset branding to defaults?')) {
              resetMutation.mutate();
            }
          }}
          className="btn btn-secondary"
          disabled={resetMutation.isPending}
        >
          <FiRefreshCw className="w-5 h-5" />
          Reset to Defaults
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Colors */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Colors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  defaultValue={b.primaryColor}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={b.primaryColor}
                  readOnly
                  className="input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Secondary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="secondaryColor"
                  defaultValue={b.secondaryColor}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={b.secondaryColor}
                  readOnly
                  className="input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="accentColor"
                  defaultValue={b.accentColor}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={b.accentColor}
                  readOnly
                  className="input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="backgroundColor"
                  defaultValue={b.backgroundColor}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={b.backgroundColor}
                  readOnly
                  className="input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="textColor"
                  defaultValue={b.textColor}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={b.textColor}
                  readOnly
                  className="input flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo & Images */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Logo & Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <input
                type="text"
                name="logoUrl"
                defaultValue={b.logoUrl}
                className="input"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Favicon URL
              </label>
              <input
                type="text"
                name="faviconUrl"
                defaultValue={b.faviconUrl}
                className="input"
                placeholder="https://example.com/favicon.ico"
              />
            </div>
          </div>
        </div>

        {/* Text & Style */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Text & Style
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                defaultValue={b.companyName}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                defaultValue={b.tagline}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Template
              </label>
              <select
                name="emailTemplate"
                defaultValue={b.emailTemplate}
                className="input"
              >
                <option value="default">Default</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Login Page Style
              </label>
              <select
                name="loginPageStyle"
                defaultValue={b.loginPageStyle}
                className="input"
              >
                <option value="default">Default</option>
                <option value="split">Split Screen</option>
                <option value="centered">Centered</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sidebar Style
              </label>
              <select
                name="sidebarStyle"
                defaultValue={b.sidebarStyle}
                className="input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="colored">Colored</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom CSS
            </label>
            <textarea
              name="customCss"
              defaultValue={b.customCss}
              className="input font-mono"
              rows="5"
              placeholder="/* Add custom CSS here */"
            />
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
            {updateMutation.isPending ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CompanyBrandingPage;