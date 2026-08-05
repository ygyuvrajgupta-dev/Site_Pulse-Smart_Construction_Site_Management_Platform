import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiFileText, FiTrendingUp, FiBox,
  FiClock, FiDollarSign, FiImage, FiAlertCircle, FiCalendar
} from 'react-icons/fi';
import api from '@/services/axios';

const SITES_API = '/api/v1/sites';

function SiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: site, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      const response = await api.get(`${SITES_API}/${id}`);
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['siteStats', id],
    queryFn: async () => {
      const response = await api.get(`${SITES_API}/${id}/stats`);
      return response.data.data;
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ARCHIVED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getIssueStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getIssuePriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400';
      case 'HIGH': return 'text-orange-600 dark:text-orange-400';
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
      case 'LOW': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiMapPin },
    { id: 'reports', label: 'Daily Reports', icon: FiFileText },
    { id: 'progress', label: 'Progress', icon: FiTrendingUp },
    { id: 'materials', label: 'Materials', icon: FiBox },
    { id: 'attendance', label: 'Attendance', icon: FiClock },
    { id: 'expenses', label: 'Expenses', icon: FiDollarSign },
    { id: 'photos', label: 'Photos', icon: FiImage },
    { id: 'issues', label: 'Issues', icon: FiAlertCircle },
    { id: 'timeline', label: 'Timeline', icon: FiCalendar },
  ];

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!site) {
    return <div className="text-center py-8">Site not found</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/sites')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Sites
      </button>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary text-white flex items-center justify-center">
              <FiMapPin className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{site.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(site.status)}`}>
                  {site.status}
                </span>
                {site.code && <span className="text-sm text-gray-500 dark:text-gray-400">{site.code}</span>}
                {site.type && <span className="text-sm text-gray-500 dark:text-gray-400">{site.type}</span>}
              </div>
            </div>
          </div>
        </div>

        {site.address && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {site.address}, {site.city}, {site.state}, {site.country}
          </p>
        )}

        {site.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{site.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Reports</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalReports || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.currentProgress || 0}%</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.totalExpenseAmount ? `$${Number(stats.totalExpenseAmount).toLocaleString()}` : '$0'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Open Issues</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.issueStats?.OPEN || 0}
            </p>
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
        {activeTab === 'overview' && <OverviewTab site={site} stats={stats} />}
        {activeTab === 'reports' && <ReportsTab reports={site.reports || []} />}
        {activeTab === 'progress' && <ProgressTab progressEntries={site.progressEntries || []} />}
        {activeTab === 'materials' && <MaterialsTab materials={site.materials || []} />}
        {activeTab === 'attendance' && <AttendanceTab attendance={site.attendance || []} />}
        {activeTab === 'expenses' && <ExpensesTab expenses={site.expenses || []} />}
        {activeTab === 'photos' && <PhotosTab photos={site.photos || []} />}
        {activeTab === 'issues' && <IssuesTab issues={site.issues || []} getStatusColor={getIssueStatusColor} getPriorityColor={getIssuePriorityColor} />}
        {activeTab === 'timeline' && <TimelineTab site={site} />}
      </div>
    </div>
  );
}

function OverviewTab({ site, stats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Site Details</h3>
        <div className="space-y-3">
          {[
            ['Status', site.status],
            ['Type', site.type || 'N/A'],
            ['Address', site.address || 'N/A'],
            ['City', site.city || 'N/A'],
            ['State', site.state || 'N/A'],
            ['Country', site.country || 'N/A'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Total Reports</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats?.totalReports || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Current Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats?.currentProgress || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Materials</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats?.totalMaterials || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Attendance Records</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats?.totalAttendanceRecords || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Total Expenses</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {stats?.totalExpenseAmount ? `$${Number(stats.totalExpenseAmount).toLocaleString()}` : '$0'}
            </span>
          </div>
        </div>
      </div>

      {site.notes && (
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{site.notes}</p>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ reports }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Reports</h3>
        <button onClick={() => {}} className="btn btn-primary">
          <FiFileText className="w-4 h-4" />
          Add Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
          No reports yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {new Date(report.reportDate).toLocaleDateString()}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{report.summary}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  report.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  report.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {report.status}
                </span>
              </div>
              {report.workCompleted && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{report.workCompleted}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {report.weather && <span>Weather: {report.weather}</span>}
                {report.workersCount && <span>Workers: {report.workersCount}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressTab({ progressEntries }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progress History</h3>
      {progressEntries.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No progress records yet.</div>
      ) : (
        <div className="space-y-3">
          {progressEntries.map((entry) => (
            <div key={entry.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Progress: {entry.progress}%</h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.recordedAt).toLocaleDateString()}
                </span>
              </div>
              {entry.notes && <p className="text-sm text-gray-600 dark:text-gray-400">{entry.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialsTab({ materials }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Materials</h3>
      {materials.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No materials recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <div key={material.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{material.name}</h4>
                  {material.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{material.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Required: {material.quantityRequired}</span>
                <span>Used: {material.quantityUsed}</span>
                {material.unit && <span>Unit: {material.unit}</span>}
                {material.supplier && <span>Supplier: {material.supplier}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceTab({ attendance }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance</h3>
      {attendance.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No attendance records yet.</div>
      ) : (
        <div className="space-y-3">
          {attendance.map((record) => (
            <div key={record.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{record.employeeName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  record.status === 'PRESENT' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  record.status === 'ABSENT' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  record.status === 'HALF_DAY' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {record.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {record.checkIn && <span>In: {new Date(record.checkIn).toLocaleTimeString()}</span>}
                {record.checkOut && <span>Out: {new Date(record.checkOut).toLocaleTimeString()}</span>}
                {record.hoursWorked && <span>Hours: {record.hoursWorked}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpensesTab({ expenses }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expenses</h3>
      {expenses.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No expenses recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{expense.category}</h4>
                  {expense.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{expense.description}</p>
                  )}
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {expense.currency} {Number(expense.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
                {expense.receiptUrl && <span>Receipt attached</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotosTab({ photos }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Photos</h3>
      {photos.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No photos uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="card p-2">
              <img src={photo.url} alt={photo.caption || 'Site photo'} className="w-full h-48 object-cover rounded-lg mb-2" />
              {photo.caption && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IssuesTab({ issues, getStatusColor, getPriorityColor }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Issues</h3>
        <button onClick={() => {}} className="btn btn-primary">
          <FiAlertCircle className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">No issues reported yet.</div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{issue.title}</h4>
                  {issue.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{issue.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                </div>
              </div>
              {issue.resolution && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Resolution:</span> {issue.resolution}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ site }) {
  const timelineItems = [
    ...(site.reports || []).map(r => ({ ...r, type: 'report' })),
    ...(site.progressEntries || []).map(p => ({ ...p, type: 'progress' })),
    ...(site.issues || []).map(i => ({ ...i, type: 'issue' })),
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.reportDate || a.recordedAt);
    const dateB = new Date(b.createdAt || b.reportDate || b.recordedAt);
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Site Timeline</h3>
      <div className="space-y-3">
        {timelineItems.map((item) => (
          <div key={item.id} className="card flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${
              item.type === 'report' ? 'bg-blue-500' :
              item.type === 'progress' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.type === 'report' ? `Daily Report - ${item.summary || 'No summary'}` :
                 item.type === 'progress' ? `Progress updated to ${item.progress}%` :
                 `Issue: ${item.title}`}
              </span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {new Date(item.createdAt || item.reportDate || item.recordedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SiteDetailPage;