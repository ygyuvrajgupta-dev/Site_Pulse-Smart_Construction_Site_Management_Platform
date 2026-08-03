import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiBox, FiCheck, FiX } from 'react-icons/fi';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Company Admin - Modules Management
 */
function CompanyModulesPage() {
  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['companyModules'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.COMPANY}/modules`);
      return response.data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }) => {
      const response = await api.put(`${ROUTES.COMPANY}/modules/${id}`, { enabled });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyModules']);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Modules
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Enable or disable modules for your company
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : (
          modules?.map((module) => (
            <div key={module.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${module.enabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <FiBox className={`w-5 h-5 ${module.enabled ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {module.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: module.id, enabled: !module.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    module.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      module.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {module.description}
              </p>

              <div className="flex items-center gap-2">
                {module.enabled ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <FiCheck className="w-4 h-4" />
                    Enabled
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <FiX className="w-4 h-4" />
                    Disabled
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CompanyModulesPage;