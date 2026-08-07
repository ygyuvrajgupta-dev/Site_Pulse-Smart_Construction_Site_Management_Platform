import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiFile, FiTrendingDown, FiTrendingUp, FiCreditCard,
  FiPercent, FiPieChart, FiGrid, FiPlus
} from 'react-icons/fi';
import api from '@/services/axios';
import ExportButton from '@/components/common/ExportButton';

const FINANCE_API = '/api/v1/finance';

function FinancePage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'invoices', label: 'Invoices', icon: FiFile },
    { id: 'expenses', label: 'Expenses', icon: FiTrendingDown },
    { id: 'income', label: 'Income', icon: FiTrendingUp },
    { id: 'payments', label: 'Payments', icon: FiCreditCard },
    { id: 'gst', label: 'GST', icon: FiPercent },
    { id: 'reports', label: 'Reports', icon: FiPieChart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance & Accounting</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage invoices, expenses, income, payments, and GST
          </p>
        </div>
        <ExportButton type="finance" label="Export Finance" />
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
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'income' && <IncomeTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'gst' && <GstTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['financeReports'],
    queryFn: async () => {
      const response = await api.get(`${FINANCE_API}/reports`);
      return response.data.data;
    },
  });

  const statCards = [
    { label: 'Total Income', value: stats?.totalIncome ? `$${Number(stats.totalIncome).toLocaleString()}` : '$0', icon: FiTrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Total Expenses', value: stats?.totalExpenses ? `$${Number(stats.totalExpenses).toLocaleString()}` : '$0', icon: FiTrendingDown, color: 'bg-red-100 text-red-600' },
    { label: 'Net Profit', value: stats?.netProfit ? `$${Number(stats.netProfit).toLocaleString()}` : '$0', icon: FiPieChart, color: 'bg-blue-100 text-blue-600' },
    { label: 'Invoices', value: stats?.totalInvoices || 0, icon: FiFile, color: 'bg-purple-100 text-purple-600' },
    { label: 'Payments Received', value: stats?.totalPaymentAmount ? `$${Number(stats.totalPaymentAmount).toLocaleString()}` : '$0', icon: FiCreditCard, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Income Entries', value: stats?.incomeCount || 0, icon: FiTrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Expense Entries', value: stats?.expenseCount || 0, icon: FiTrendingDown, color: 'bg-red-100 text-red-600' },
    { label: 'Invoice Amount', value: stats?.totalInvoiceAmount ? `$${Number(stats.totalInvoiceAmount).toLocaleString()}` : '$0', icon: FiFile, color: 'bg-blue-100 text-blue-600' },
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

function getStatusColor(status) {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-800';
    case 'SENT': return 'bg-blue-100 text-blue-800';
    case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800';
    case 'OVERDUE': return 'bg-red-100 text-red-800';
    case 'CANCELLED': return 'bg-gray-100 text-gray-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

function InvoicesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['financeInvoices'],
    queryFn: async () => {
      const response = await api.get(`${FINANCE_API}/invoices`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoices</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No invoices yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{invoice.invoiceNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.client?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.total ? `${invoice.currency} ${Number(invoice.total).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status ? invoice.status.replace('_', ' ') : 'N/A'}
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

function ExpensesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['financeExpenses'],
    queryFn: async () => {
      const response = await api.get(`${FINANCE_API}/expenses`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expenses</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No expenses recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{expense.description || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{expense.category || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-red-600">
                        {expense.currency} {Number(expense.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(expense.transactionDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{expense.status}</span>
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

function IncomeTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['financeIncome'],
    queryFn: async () => {
      const response = await api.get(`${FINANCE_API}/income`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Income</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Record Income
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No income recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((income) => (
                    <tr key={income.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{income.description || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{income.category || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        {income.currency} {Number(income.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(income.transactionDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{income.status}</span>
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

function getPaymentStatusColor(status) {
  switch (status) {
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'FAILED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function PaymentsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['financePayments'],
    queryFn: async () => {
      const response = await api.get(`${FINANCE_API}/payments`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payments</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No payments recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{payment.invoice?.invoiceNo || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payment.client?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {payment.currency} {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payment.method ? payment.method.replace('_', ' ') : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
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

function GstTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['financeGst'],
    queryFn: async () => {
      const response = await api.get(`${FINANCE_API}/gst`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GST Records</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add GST Record
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No GST records.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.gstType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.gstin || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.invoiceNo || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.taxableAmount || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.gstAmount || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{record.totalAmount || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.period || '—'}</td>
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

function ReportsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['financeReportsTab'],
    queryFn: async () => {
      const response = await api.get(`${FINANCE_API}/reports`);
      return response.data.data;
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  const metrics = [
    { label: 'Total Income', value: data?.totalIncome || 0 },
    { label: 'Total Expenses', value: data?.totalExpenses || 0 },
    { label: 'Net Profit', value: data?.netProfit || 0 },
    { label: 'Total Invoices', value: data?.totalInvoices || 0 },
    { label: 'Invoice Amount', value: data?.totalInvoiceAmount || 0 },
    { label: 'Total Payments', value: data?.totalPaymentAmount || 0 },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Reports</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(data?.totalIncome !== undefined && metric.label !== 'Total Invoices') ? `$${Number(metric.value).toLocaleString()}` : Number(metric.value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FinancePage;