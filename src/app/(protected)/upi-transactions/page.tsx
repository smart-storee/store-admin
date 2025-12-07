'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/Card';
import { Table, TableRow } from '@/components/Table';
import { Button } from '@/components/Button';
import {
  MoreHorizontal,
  Search,
  Download,
  Eye,
  Filter,
  Calendar,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import UpiTransactionService from '@/services/upiTransactionService';

const UpiTransactionsPage = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchUpiTransactions();
  }, [page, statusFilter, searchTerm, dateRange]);

  const setShowDetailsModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  const fetchUpiTransactions = async () => {
    setLoading(true);
    try {
      const service = new UpiTransactionService();
      const params: any = {
        page,
        limit,
      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (dateRange?.from) {
        params.date_from = dateRange.from.toISOString();
      }

      if (dateRange?.to) {
        params.date_to = dateRange.to.toISOString();
      }

      const response = await service.getUpiTransactions(params);
      setTransactions(response.data || []);

      // Also get summary data
      const summaryResponse = await service.getUpiTransactionSummary();
      setSummary(summaryResponse.data?.summary || null);
    } catch (error: any) {
      console.error('Error fetching UPI transactions:', error);
      alert(error.message || 'Failed to load UPI transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 '; // Success badge
      case 'pending':
        return 'bg-blue-100 text-blue-800 '; // Pending/default badge
      case 'failed':
      case 'initiated_timeout':
        return 'bg-red-100 text-red-800 '; // Failed/destructive badge
      case 'refunded':
        return 'bg-gray-100 text-gray-800 '; // Secondary badge
      default:
        return 'bg-gray-100 text-gray-800 '; // Default badge
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
      case 'initiated_timeout':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return the original string if parsing fails
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">UPI Transactions</h2>
          <p className="text-muted-foreground">
            Manage and monitor UPI payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={summary?.totalTransactions || 0}
          icon={<CreditCard className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Successful"
          value={summary?.successfulTransactions || 0}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Failed"
          value={summary?.failedTransactions || 0}
          icon={<XCircle className="h-6 w-6 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(summary?.totalRevenue || 0).toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Filters and Search */}
      <Card title="Filters & Search">
        <div className="flex flex-col md:flex-row gap-4 mb-4 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions, customers, orders..."
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="initiated_timeout">Timeout</option>
            <option value="refunded">Refunded</option>
          </select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>

        {/* Transactions Table */}
        <div className="mt-6">
          <Card title="Transactions">
            <div className="rounded-md border">
              <Table headers={[
                'Transaction ID',
                'Order',
                'Customer',
                'UPI ID',
                'Amount',
                'Status',
                'Initiated At',
                'Verified At',
                'Actions'
              ]}>
                {loading ? (
                  <TableRow key="loading">
                    <td colSpan={9} className="text-center py-8">
                      Loading transactions...
                    </td>
                  </TableRow>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.transaction_id || transaction.upi_transaction_id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center">
                          <span>{getStatusIcon(transaction.status)}</span>
                          <span className="ml-2">{transaction.upi_transaction_id}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {transaction.order_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{transaction.customer_name}</div>
                          <div className="text-sm text-gray-500">{transaction.customer_phone}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {transaction.upi_id}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ₹{transaction.amount}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`${getStatusBadgeClass(transaction.status)} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                          {transaction.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(transaction.initiated_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {transaction.verified_at ? formatDate(transaction.verified_at) : '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={() => {
                              // Show transaction details in a modal
                              setShowDetailsModal(transaction);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={9} className="text-center py-8 text-center">
                      No transactions found
                    </td>
                  </TableRow>
                )}
              </Table>
            </div>
          </Card>
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * limit, summary?.totalTransactions || 0)}
              </span>{' '}
              of <span className="font-medium">{summary?.totalTransactions || 0}</span> transactions
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => { if (page > 1) setPage(page - 1); }}
                disabled={page <= 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Previous
              </button>

              {page > 3 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                </>
              )}

              {page > 2 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {page - 1}
                </button>
              )}

              <button
                onClick={() => { }}
                className="relative z-10 inline-flex items-center px-4 py-2 border border-indigo-500 bg-indigo-50 text-sm font-medium text-indigo-600"
              >
                {page}
              </button>

              {page < Math.ceil((summary?.totalTransactions || 0) / limit) - 1 && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {page + 1}
                </button>
              )}

              {page < Math.ceil((summary?.totalTransactions || 0) / limit) - 2 && (
                <>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                  <button
                    onClick={() => setPage(Math.ceil((summary?.totalTransactions || 0) / limit))}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {Math.ceil((summary?.totalTransactions || 0) / limit)}
                  </button>
                </>
              )}

              <button
                onClick={() => { if (page < Math.ceil((summary?.totalTransactions || 0) / limit)) setPage(page + 1); }}
                disabled={page >= Math.ceil((summary?.totalTransactions || 0) / limit)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page >= Math.ceil((summary?.totalTransactions || 0) / limit)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        {/* Transaction Details Modal */}
        {isDetailsModalOpen && selectedTransaction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction Details</h3>
                <div className="mt-2 px-7 py-3">
                  <div className="grid gap-4 py-4">
                    <div>
                      <h4 className="font-semibold text-left">Transaction Information</h4>
                      <p className="text-sm text-left">ID: {selectedTransaction.upi_transaction_id}</p>
                      <p className="text-sm text-left">Order: {selectedTransaction.order_number}</p>
                      <p className="text-sm text-left">Status: {selectedTransaction.status.replace('_', ' ')}</p>
                      <p className="text-sm text-left">Amount: ₹{selectedTransaction.amount}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-left">Timeline</h4>
                      <p className="text-sm text-left">Initiated: {formatDate(selectedTransaction.initiated_at)}</p>
                      <p className="text-sm text-left">Verified: {selectedTransaction.verified_at ? formatDate(selectedTransaction.verified_at) : 'Not verified'}</p>
                      <p className="text-sm text-left">Attempts: {selectedTransaction.attempts}</p>
                    </div>
                  </div>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UpiTransactionsPage;