import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiPlus, FiTrash2, FiEdit, FiFlag, FiList, FiUsers,
  FiCalendar, FiPaperclip, FiMessageSquare, FiFolder
} from 'react-icons/fi';
import api from '@/services/axios';

const PROJECTS_API = '/api/v1/projects';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`${PROJECTS_API}/${id}`);
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['projectStats', id],
    queryFn: async () => {
      const response = await api.get(`${PROJECTS_API}/${id}/stats`);
      return response.data.data;
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`${PROJECTS_API}/${id}/milestones`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      setShowMilestoneModal(false);
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, data }) => {
      const response = await api.put(`${PROJECTS_API}/${id}/milestones/${milestoneId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      setEditingMilestone(null);
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId) => {
      const response = await api.delete(`${PROJECTS_API}/${id}/milestones/${milestoneId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNING':
      case 'NOT_STARTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ON_HOLD':
      case 'DELAYED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DONE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiFolder },
    { id: 'milestones', label: 'Milestones', icon: FiFlag },
    { id: 'tasks', label: 'Tasks', icon: FiList },
    { id: 'timeline', label: 'Timeline', icon: FiCalendar },
    { id: 'members', label: 'Members', icon: FiUsers },
    { id: 'attachments', label: 'Attachments', icon: FiPaperclip },
    { id: 'comments', label: 'Comments', icon: FiMessageSquare },
  ];

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center py-8">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary text-white flex items-center justify-center">
              <FiFolder className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                {project.code && <span className="text-sm text-gray-500 dark:text-gray-400">{project.code}</span>}
                {project.client && <span className="text-sm text-gray-500 dark:text-gray-400">Client: {project.client.name}</span>}
              </div>
            </div>
          </div>
          <div className="w-full md:w-64">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className="bg-secondary rounded-full h-3 transition-all" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>

        {project.description && <p className="mt-4 text-gray-600 dark:text-gray-400">{project.description}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalTasks || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Milestones</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalMilestones || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Est. Hours</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalEstimatedHours || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Actual Hours</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalActualHours || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-secondary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab project={project} stats={stats} />}
        {activeTab === 'milestones' && (
          <MilestonesTab
            milestones={project.milestones || []}
            onAdd={() => setShowMilestoneModal(true)}
            onEdit={(m) => setEditingMilestone(m)}
            onDelete={(m) => { if (window.confirm('Delete this milestone?')) deleteMilestoneMutation.mutate(m.id); }}
            getStatusColor={getStatusColor}
          />
        )}
        {activeTab === 'tasks' && <TasksTab tasks={project.tasks || []} getStatusColor={getTaskStatusColor} />}
        {activeTab === 'timeline' && <TimelineTab milestones={project.milestones || []} tasks={project.tasks || []} />}
        {activeTab === 'members' && <MembersTab tasks={project.tasks || []} />}
        {activeTab === 'attachments' && <AttachmentsTab />}
        {activeTab === 'comments' && <CommentsTab />}
      </div>

      {(showMilestoneModal || editingMilestone) && (
        <MilestoneModal
          milestone={editingMilestone}
          onClose={() => { setShowMilestoneModal(false); setEditingMilestone(null); }}
          onSubmit={(formData) => {
            if (editingMilestone) {
              updateMilestoneMutation.mutate({ milestoneId: editingMilestone.id, data: formData });
            } else {
              createMilestoneMutation.mutate(formData);
            }
          }}
          isSubmitting={createMilestoneMutation.isPending || updateMilestoneMutation.isPending}
        />
      )}
    </div>
  );
}

function OverviewTab({ project, stats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Details</h3>
        <div className="space-y-3">
          {[
            ['Status', project.status.replace('_', ' ')],
            ['Priority', project.priority],
            ['Start Date', project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'],
            ['End Date', project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'],
            ['Budget', project.budget ? `${project.currency} ${Number(project.budget).toLocaleString()}` : 'N/A'],
            ['Actual Cost', project.actualCost ? `${project.currency} ${Number(project.actualCost).toLocaleString()}` : 'N/A'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Status</h3>
        <div className="space-y-3">
          {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'].map((status) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">{status.replace('_', ' ')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats?.taskCounts?.[status] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Milestone Status</h3>
        <div className="space-y-3">
          {['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'].map((status) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">{status.replace('_', ' ')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats?.milestoneCounts?.[status] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {project.notes && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}
    </div>
  );
}

function MilestonesTab({ milestones, onAdd, onEdit, onDelete, getStatusColor }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Milestones</h3>
        <button onClick={onAdd} className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
          No milestones yet. Add your first milestone to track project progress.
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="card flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{milestone.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                  {milestone.status.replace('_', ' ')}
                </span>
                <button onClick={() => onEdit(milestone)} className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <FiEdit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(milestone)} className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksTab({ tasks, getStatusColor }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h3>

      {tasks.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No tasks yet.</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              {task.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {task.assignee && <span>Assigned: {task.assignee.name}</span>}
                {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                {task.estimatedHours && <span>Est: {task.estimatedHours}h</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ milestones, tasks }) {
  const timelineItems = [
    ...(milestones || []).map(m => ({ id: m.id, type: 'milestone', title: m.name, date: m.dueDate, status: m.status })),
    ...(tasks || []).map(t => ({ id: t.id, type: 'task', title: t.title, date: t.dueDate, status: t.status })),
  ].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-blue-500';
      case 'TODO': return 'bg-gray-400';
      case 'IN_PROGRESS': return 'bg-green-500';
      case 'IN_REVIEW': return 'bg-yellow-500';
      case 'COMPLETED':
      case 'DONE': return 'bg-purple-500';
      case 'DELAYED':
      case 'ON_HOLD':
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Timeline</h3>
      <div className="space-y-3">
        {timelineItems.map((item) => (
          <div key={item.id} className="card flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
              </span>
            </div>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              item.type === 'milestone' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {item.type === 'milestone' ? 'Milestone' : 'Task'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersTab({ tasks }) {
  const members = {};
  tasks.forEach(task => {
    if (task.assignee) {
      if (!members[task.assignee.id]) {
        members[task.assignee.id] = { ...task.assignee, taskCount: 0 };
      }
      members[task.assignee.id].taskCount++;
    }
  });

  const membersList = Object.values(members);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Members</h3>

      {membersList.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No members assigned yet.</div>
      ) : (
        <div className="space-y-3">
          {membersList.map((member) => (
            <div key={member.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.taskCount} task(s)</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentsTab() {
  return (
    <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
      <FiPaperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>No attachments yet. Attachments will be available soon.</p>
    </div>
  );
}

function CommentsTab() {
  return (
    <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
      <FiMessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>No comments yet. Comments will be available soon.</p>
    </div>
  );
}

function MilestoneModal({ milestone, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: milestone?.name || '',
    description: milestone?.description || '',
    status: milestone?.status || 'NOT_STARTED',
    dueDate: milestone?.dueDate?.split('T')[0] || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{milestone ? 'Edit Milestone' : 'Add Milestone'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {milestone ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectDetailPage;