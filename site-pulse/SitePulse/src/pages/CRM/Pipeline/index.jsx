import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiDollarSign, FiTrendingUp, FiUsers } from 'react-icons/fi';
import api from '@/services/axios';

const CRM_API = '/api/v1/crm';

/**
 * CRM Pipeline - Kanban Board
 * Drag and drop leads between pipeline stages
 */
function CrmPipelinePage() {
  const [draggedLead, setDraggedLead] = useState(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['crmPipeline'],
    queryFn: async () => {
      const response = await api.get(`${CRM_API}/pipeline`);
      return response.data.data;
    },
  });

  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, stageId }) => {
      const response = await api.patch(`${CRM_API}/pipeline/leads/${leadId}/move/${stageId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crmPipeline']);
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`${CRM_API}/pipeline/stages`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crmPipeline']);
      setShowStageModal(false);
    },
  });

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    if (draggedLead && draggedLead.stageId !== stageId) {
      moveLeadMutation.mutate({ leadId: draggedLead.id, stageId });
    }
    setDraggedLead(null);
  };

  const handleCreateStage = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createStageMutation.mutate({
      name: formData.get('name'),
      color: formData.get('color'),
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading pipeline...</div>;
  }

  const stages = pipeline?.stages || [];
  const metrics = pipeline?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pipeline
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Drag and drop leads between stages
          </p>
        </div>
        <button
          onClick={() => setShowStageModal(true)}
          className="btn btn-secondary"
        >
          <FiPlus className="w-5 h-5" />
          Add Stage
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
            <FiUsers className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.totalLeads || 0}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
            <FiDollarSign className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pipeline Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(metrics.totalValue || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
            <FiTrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Stages</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.stageCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div
              className="flex items-center justify-between p-3 rounded-t-lg border-l-4"
              style={{ borderColor: stage.color }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {stage.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({stage._count?.leads || 0})
                </span>
              </div>
            </div>

            {/* Stage Body */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-b-lg p-2 min-h-[200px] space-y-2">
              {stage.leads?.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lead.name}
                      </p>
                      {lead.company && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.company}
                        </p>
                      )}
                    </div>
                    {lead.estimatedValue && (
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        ${lead.estimatedValue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {lead.assignedTo && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-medium">
                          {lead.assignedTo.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {lead.assignedTo.name}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
              {stage.leads?.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create Pipeline Stage
            </h2>
            <form onSubmit={handleCreateStage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stage Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  required
                  placeholder="e.g., Contacted, Qualified, Proposal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  name="color"
                  defaultValue="#3B82F6"
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowStageModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createStageMutation.isPending}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrmPipelinePage;