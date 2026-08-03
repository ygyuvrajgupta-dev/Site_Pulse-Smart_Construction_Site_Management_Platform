import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTrash2, FiEdit, FiShield, FiLock } from 'react-icons/fi';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Company Admin - Roles Management
 */
function CompanyRolesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['companyRoles'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.COMPANY}/roles`);
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`${ROUTES.COMPANY}/roles`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyRoles']);
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`${ROUTES.COMPANY}/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyRoles']);
      setEditingRole(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`${ROUTES.COMPANY}/roles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyRoles']);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage roles and permissions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <FiPlus className="w-5 h-5" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : (
          roles?.map((role) => (
            <div key={role.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.isSystem ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900'}`}>
                    {role.isSystem ? <FiLock className="w-5 h-5 text-gray-500" /> : <FiShield className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {role.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {role.slug}
                    </p>
                  </div>
                </div>
                {role.isSystem && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    System
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {role.description || 'No description'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{role._count?.users || 0} users</span>
                <span>{role._count?.rolePermissions || 0} permissions</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPermissionsModal(role)}
                  className="btn btn-secondary flex-1"
                >
                  <FiShield className="w-4 h-4" />
                  Permissions
                </button>
                {!role.isSystem && (
                  <>
                    <button
                      onClick={() => setEditingRole(role)}
                      className="btn btn-secondary"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this role?')) {
                          deleteMutation.mutate(role.id);
                        }
                      }}
                      className="btn btn-danger"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Role Modal */}
      {(showModal || editingRole) && (
        <RoleModal
          role={editingRole}
          onClose={() => {
            setShowModal(false);
            setEditingRole(null);
          }}
          onSubmit={(formData) => {
            if (editingRole) {
              updateMutation.mutate({ id: editingRole.id, data: formData });
            } else {
              createMutation.mutate(formData);
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <PermissionsModal
          role={showPermissionsModal}
          onClose={() => setShowPermissionsModal(null)}
        />
      )}
    </div>
  );
}

function RoleModal({ role, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    slug: role?.slug || '',
    description: role?.description || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {role ? 'Edit Role' : 'Create Role'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {role ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsModal({ role, onClose }) {
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState(
    role.rolePermissions?.map((rp) => rp.permissionId) || []
  );

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: async () => {
      const response = await api.get(`${ROUTES.COMPANY}/roles/${role.id}`);
      return response.data.data.rolePermissions?.map((rp) => rp.permission) || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (permissionIds) => {
      const response = await api.post(`${ROUTES.COMPANY}/roles/${role.id}/permissions`, {
        permissionIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyRoles']);
      onClose();
    },
  });

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Permissions - {role.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading permissions...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions?.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {permission.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {permission.slug}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => assignMutation.mutate(selectedPermissions)}
                className="btn btn-primary"
                disabled={assignMutation.isPending}
              >
                Save Permissions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanyRolesPage;