import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiUsers, FiClock, FiCalendar, FiDollarSign, FiBriefcase,
  FiGrid, FiStar, FiFileText, FiPlus
} from 'react-icons/fi';
import api from '@/services/axios';
import ExportButton from '@/components/common/ExportButton';

const HR_API = '/api/v1/hr';

function HrPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'employees', label: 'Employees', icon: FiUsers },
    { id: 'attendance', label: 'Attendance', icon: FiClock },
    { id: 'leaves', label: 'Leaves', icon: FiCalendar },
    { id: 'payroll', label: 'Payroll', icon: FiDollarSign },
    { id: 'recruitment', label: 'Recruitment', icon: FiBriefcase },
    { id: 'departments', label: 'Departments', icon: FiGrid },
    { id: 'performance', label: 'Performance', icon: FiStar },
    { id: 'documents', label: 'Documents', icon: FiFileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employees, attendance, leaves, payroll, and more
          </p>
        </div>
        <ExportButton type="employees" label="Export Employees" />
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
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'leaves' && <LeavesTab />}
        {activeTab === 'payroll' && <PayrollTab />}
        {activeTab === 'recruitment' && <RecruitmentTab />}
        {activeTab === 'departments' && <DepartmentsTab />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'documents' && <DocumentsTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hrStats'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/stats`);
      return response.data.data;
    },
  });

  const statCards = [
    { label: 'Total Employees', value: stats?.totalEmployees || 0, icon: FiUsers, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Employees', value: stats?.activeEmployees || 0, icon: FiUsers, color: 'bg-green-100 text-green-600' },
    { label: 'Pending Leaves', value: stats?.pendingLeaves || 0, icon: FiCalendar, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Approved Leaves', value: stats?.approvedLeaves || 0, icon: FiCalendar, color: 'bg-purple-100 text-purple-600' },
    { label: 'Total Payroll', value: stats?.totalPayroll ? `$${Number(stats.totalPayroll).toLocaleString()}` : '$0', icon: FiDollarSign, color: 'bg-green-100 text-green-600' },
    { label: 'Open Jobs', value: stats?.openJobs || 0, icon: FiBriefcase, color: 'bg-orange-100 text-orange-600' },
    { label: 'Departments', value: stats?.totalDepartments || 0, icon: FiGrid, color: 'bg-blue-100 text-blue-600' },
    { label: 'Performance Reviews', value: stats?.totalReviews || 0, icon: FiStar, color: 'bg-pink-100 text-pink-600' },
  ];

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="card">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function EmployeesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrEmployees'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/employees`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employees</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employment Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(data?.employees || []).map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                          {emp.user?.name ? emp.user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{emp.user?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{emp.employeeCode || 'No code'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.jobTitle || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.employmentType || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getAttendanceStatusColor(status) {
  switch (status) {
    case 'PRESENT': return 'bg-green-100 text-green-800';
    case 'ABSENT': return 'bg-red-100 text-red-800';
    case 'HALF_DAY': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function AttendanceTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrAttendance'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/attendance`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance</h3>
        <ExportButton type="attendance" label="Export Attendance" />
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Record Attendance
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No attendance records.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{record.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAttendanceStatusColor(record.status)}`}>
                          {record.status ? record.status.replace('_', ' ') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.hoursWorked || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getLeaveStatusColor(status) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED': return 'bg-green-100 text-green-800';
    case 'REJECTED': return 'bg-red-100 text-red-800';
    case 'CANCELLED': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function LeavesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrLeaves'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/leaves`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leaves</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No leave requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((leave) => (
                    <tr key={leave.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {leave.employee?.user?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{leave.leaveType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{leave.days}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLeaveStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getPayrollStatusColor(status) {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-800';
    case 'PROCESSED': return 'bg-blue-100 text-blue-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

function PayrollTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrPayroll'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/payrolls`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payroll</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Create Payroll
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No payroll records.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((pay) => (
                    <tr key={pay.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {pay.employee?.user?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(pay.periodStart).toLocaleDateString()} - {new Date(pay.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">${pay.basicSalary?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">${pay.allowances?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">${pay.deductions?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${pay.netSalary?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPayrollStatusColor(pay.status)}`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecruitmentTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrJobs'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/recruitment/jobs`);
      return response.data.data;
    },
  });

  function getJobStatusColor(status) {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'HIRED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recruitment</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Post Job
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data || []).map((job) => (
            <div key={job.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{job.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getJobStatusColor(job.status)}`}>
                  {job.status ? job.status.replace('_', ' ') : 'N/A'}
                </span>
              </div>
              {job.department && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{job.department}</p>}
              {job.location && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">📍 {job.location}</p>}
              {job.salaryRange && <p className="text-sm text-gray-500 dark:text-gray-400">💰 {job.salaryRange}</p>}
              {job.employmentType && <p className="text-sm text-gray-500 dark:text-gray-400">💼 {job.employmentType}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrDepartments'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/departments`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Departments</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data || []).map((dept) => (
            <div key={dept.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h4>
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-white rounded-full">
                  {dept._count?.employees || 0} employees
                </span>
              </div>
              {dept.code && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Code: {dept.code}</p>}
              {dept.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{dept.description}</p>
              )}
              {dept.head && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Head: <span className="font-medium">{dept.head.name}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getRatingColor(rating) {
  switch (rating) {
    case 'EXCELLENT': return 'bg-green-100 text-green-800';
    case 'GOOD': return 'bg-blue-100 text-blue-800';
    case 'SATISFACTORY': return 'bg-yellow-100 text-yellow-800';
    case 'NEEDS_IMPROVEMENT': return 'bg-orange-100 text-orange-800';
    case 'POOR': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function PerformanceTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrPerformance'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/performance`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Reviews</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          New Review
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-3">
          {(!data || data.length === 0) ? (
            <div className="card text-center py-8 text-gray-500">No reviews yet.</div>
          ) : (
            (data || []).map((review) => (
              <div key={review.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {review.employee?.user?.name || 'N/A'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Period: {review.period}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(review.rating)}`}>
                    {review.rating ? review.rating.replace('_', ' ') : 'N/A'}
                  </span>
                </div>
                {review.strengths && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-medium">Strengths:</span> {review.strengths}
                  </p>
                )}
                {review.improvements && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Improvements:</span> {review.improvements}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DocumentsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrDocuments'],
    queryFn: async () => {
      const response = await api.get(`${HR_API}/documents`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No HR documents.</div>
          ) : (
            <div className="space-y-3">
              {(data || []).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiFileText className="w-5 h-5 text-secondary" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{doc.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.fileName} • {Math.round(doc.fileSize / 1024)}KB
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HrPage;