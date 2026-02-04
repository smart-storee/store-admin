'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useStore } from '@/contexts/StoreContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ApiResponse, Branch } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
  }>;
  daily_revenue: Array<{
    date: string;
    revenue: number;
  }>;
  monthly_summary: Array<{
    month: string;
    total_orders: number;
    total_revenue: number;
  }>;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { features } = useStore();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [storeLogo, setStoreLogo] = useState<string>('');

  const toNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value === null || value === undefined) return 0;
    const normalized = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCount = (value: unknown) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
      Math.trunc(toNumber(value))
    );

  const formatCurrency = (value: unknown, digits = 2) => {
    const num = toNumber(value);
    const fixed = num.toFixed(digits);
    const [whole, frac] = fixed.split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    const absWhole = sign ? whole.slice(1) : whole;
    const last3 = absWhole.slice(-3);
    const rest = absWhole.slice(0, -3);
    const withGroups =
      rest.length > 0
        ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`
        : last3;
    const formatted = `${sign}${withGroups}`;
    return frac !== undefined ? `${formatted}.${frac}` : formatted;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch branches
        if (user?.store_id) {
          const branchesResponse: ApiResponse<{ data: Branch[] }> =
            await makeAuthenticatedRequest(
              `/branches?store_id=${user?.store_id}`,
              {},
              true, // auto-refresh token
              user?.store_id,
              user?.branch_id || undefined
            );

          if (branchesResponse.success) {
            const branchesData = Array.isArray(branchesResponse.data.data)
              ? branchesResponse.data.data
              : branchesResponse.data.data || branchesResponse.data || [];
            setBranches(branchesData);
          } else {
            throw new Error(branchesResponse.message || 'Failed to fetch branches');
          }

          // Fetch store config (name and logo)
          try {
            const storeConfigResponse: ApiResponse<any> = await makeAuthenticatedRequest(
              `/app-settings?store_id=${user.store_id}`,
              {},
              true,
              user.store_id,
              user.branch_id || undefined
            );

            if (storeConfigResponse.success) {
              const config = storeConfigResponse.data.data || storeConfigResponse.data;
              setStoreName(config.app_name || user.store_name || 'Store');
              setStoreLogo(config.logo_url || '');
            } else {
              setStoreName(user.store_name || 'Store');
              setStoreLogo('');
            }
          } catch (configErr) {
            console.error('Error fetching store config:', configErr);
            setStoreName(user.store_name || 'Store');
            setStoreLogo('');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load initial data');
        console.error('Load initial data error:', err);
      }
    };

    if (user?.store_id) {
      fetchInitialData();
    }
  }, [user?.store_id, user?.branch_id, user?.store_name]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          store_id: user?.store_id?.toString() || '1',
        });

        if (selectedBranch) {
          params.append('branch_id', selectedBranch.toString());
        }

        if (dateRange.startDate) {
          params.append('start_date', dateRange.startDate);
        }

        if (dateRange.endDate) {
          params.append('end_date', dateRange.endDate);
        }

        const response: ApiResponse<{ data: ReportData }> =
          await makeAuthenticatedRequest(
            `/reports/summary?${params.toString()}`,
            {},
            true, // auto-refresh token
            user?.store_id,
            selectedBranch || user?.branch_id || undefined
          );

        if (response.success) {
          setReportData(response.data.data || response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch report data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load report data');
        console.error('Load report data error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.store_id) {
      fetchReportData();
    }
  }, [user?.store_id, selectedBranch, dateRange]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prev) => {
      const next = { ...prev, [name]: value };
      if (next.startDate && next.endDate && next.startDate > next.endDate) {
        if (name === "startDate") {
          next.endDate = next.startDate;
        } else {
          next.startDate = next.endDate;
        }
      }
      return next;
    });
  };

  const handleBranchChange = (branchId: number | null) => {
    setSelectedBranch(branchId);
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;

    try {
      const pdfCurrencyPrefix = 'INR ';
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Header with Logo and Store Name
      const logoSize = 20; // Logo size in mm
      const logoX = 14; // Left margin
      const logoY = yPosition;
      let logoLoaded = false;
      
      // Add logo if available
      if (storeLogo) {
        try {
          // Try to load and add logo to PDF
          const response = await fetch(storeLogo, { mode: 'cors' });
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise((resolve, reject) => {
              reader.onloadend = () => {
                try {
                  const base64data = reader.result as string;
                  pdf.addImage(base64data, 'PNG', logoX, logoY, logoSize, logoSize);
                  logoLoaded = true;
                  resolve(true);
                } catch (err) {
                  console.warn('Could not add logo to PDF:', err);
                  resolve(false);
                }
              };
              reader.onerror = () => {
                console.warn('Could not read logo file');
                resolve(false);
              };
              reader.readAsDataURL(blob);
            });
          }
        } catch (logoError) {
          console.warn('Could not load logo:', logoError);
          // Continue without logo
        }
      }

      // Store Name and Report Title
      const textStartX = logoLoaded ? logoX + logoSize + 5 : 14;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const storeNameText = storeName || user?.store_name || 'Store';
      pdf.text(storeNameText, textStartX, yPosition + 8);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Business Reports & Analytics', textStartX, yPosition + 15);
      
      yPosition += 25;

      // Report period
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const periodText = dateRange.startDate && dateRange.endDate
        ? `Period: ${new Date(dateRange.startDate).toLocaleDateString('en-IN')} - ${new Date(dateRange.endDate).toLocaleDateString('en-IN')}`
        : `Period: Last 30 days`;
      pdf.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      // Branch filter info
      if (selectedBranch) {
        const branchName = branches.find(b => b.branch_id === selectedBranch)?.branch_name || 'Selected Branch';
        pdf.text(`Branch: ${branchName}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }

      yPosition += 5;

      // Summary Cards
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary', 14, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Orders', formatCount(reportData.total_orders)],
        ['Total Revenue', `${pdfCurrencyPrefix}${formatCurrency(reportData.total_revenue, 2)}`],
        ['Average Order Value', `${pdfCurrencyPrefix}${formatCurrency(reportData.avg_order_value, 2)}`],
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
      checkPageBreak(50);

      // Top Products
      if (reportData.top_products && reportData.top_products.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Top Selling Products', 14, yPosition);
        yPosition += 8;

        const topProductsData = [
          ['Rank', 'Product Name', 'Quantity Sold'],
          ...reportData.top_products.map((product, index) => [
            `#${index + 1}`,
            product.product_name,
            product.quantity_sold.toString(),
          ]),
        ];

        autoTable(pdf, {
          startY: yPosition,
          head: [topProductsData[0]],
          body: topProductsData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 15;
        checkPageBreak(50);
      }

      // Monthly Summary
      if (reportData.monthly_summary && reportData.monthly_summary.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Monthly Summary', 14, yPosition);
        yPosition += 8;

        const monthlyData = [
          ['Month', 'Total Orders', 'Total Revenue'],
          ...reportData.monthly_summary.map((month) => [
            month.month,
            formatCount(month.total_orders),
            `${pdfCurrencyPrefix}${formatCurrency(month.total_revenue, 2)}`,
          ]),
        ];

        autoTable(pdf, {
          startY: yPosition,
          head: [monthlyData[0]],
          body: monthlyData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 15;
        checkPageBreak(30);
      }

      // Daily Revenue (if available)
      if (reportData.daily_revenue && reportData.daily_revenue.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Daily Revenue Breakdown', 14, yPosition);
        yPosition += 8;

        // Show first 20 days to avoid table overflow
        const dailyDataToShow = reportData.daily_revenue.slice(0, 20);
        const dailyData = [
          ['Date', 'Revenue'],
          ...dailyDataToShow.map((day) => [
            new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            `${pdfCurrencyPrefix}${formatCurrency(day.revenue, 2)}`,
          ]),
        ];

        autoTable(pdf, {
          startY: yPosition,
          head: [dailyData[0]],
          body: dailyData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });

        if (reportData.daily_revenue.length > 20) {
          yPosition = (pdf as any).lastAutoTable.finalY + 10;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'italic');
          pdf.text(`* Showing first 20 days. Total days: ${reportData.daily_revenue.length}`, 14, yPosition);
        }
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          `Generated on ${new Date().toLocaleString('en-IN')} | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Generate filename
      const branchSuffix = selectedBranch ? `_${branches.find(b => b.branch_id === selectedBranch)?.branch_name?.replace(/\s+/g, '_') || 'branch'}` : '';
      const dateSuffix = dateRange.startDate && dateRange.endDate
        ? `_${dateRange.startDate}_to_${dateRange.endDate}`
        : `_${new Date().toISOString().split('T')[0]}`;
      const filename = `Business_Report${branchSuffix}${dateSuffix}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report. Please try again.');
    }
  };

  // Check if reports feature is enabled
  if (features && !features.reports_enabled) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
        <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 text-center`}>
          <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Reports Access Disabled
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Reports access is not enabled for this store. Please contact support to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={['view_reports']}
      fallback={
        <div className="p-6 text-center">
          <div className={`border rounded-lg px-4 py-3 mb-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
            Access denied. You do not have permission to view reports.
          </div>
        </div>
      }
    >
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
        <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Reports & Analytics
                </h1>
                <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Detailed insights and analytics for your business
                </p>
              </div>
              {reportData && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className={`mt-4 sm:mt-0 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF Report
                </button>
              )}
            </div>

            {/* Filters */}
            <div className={`mb-8 p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label htmlFor="branch-filter" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Filter by Branch
                  </label>
                  <select
                    id="branch-filter"
                    value={selectedBranch || ''}
                    onChange={(e) => handleBranchChange(e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="start-date" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateRangeChange}
                    max={dateRange.endDate || undefined}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateRangeChange}
                    min={dateRange.startDate || undefined}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDateRange({ startDate: '', endDate: '' });
                      setSelectedBranch(null);
                    }}
                    className={`w-full py-2 px-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className={`mb-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/30 border border-red-700/50 text-red-300' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                {error}
              </div>
            )}

            {loading ? (
              <div className={`flex justify-center items-center h-64 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="text-center">
                  <div className="inline-flex items-center">
                    <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
                    <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce mr-1"></div>
                    <div className="h-4 w-4 rounded-full bg-indigo-600 animate-bounce"></div>
                  </div>
                  <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading reports...</p>
                </div>
              </div>
            ) : reportData ? (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                        <svg className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Total Orders</p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCount(reportData.total_orders)}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'}`}>
                        <svg className={`h-6 w-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Total Revenue</p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹{formatCurrency(reportData.total_revenue, 2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                        <svg className={`h-6 w-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Avg. Order Value</p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹{formatCurrency(reportData.avg_order_value, 2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts and Tables Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Products */}
                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Selling Products</h2>
                    <div className="space-y-4">
                      {reportData.top_products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.product_name}</p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{product.quantity_sold} units sold</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'}`}>
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Revenue Chart */}
                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Revenue Trend</h2>
                    {reportData.daily_revenue && reportData.daily_revenue.length > 0 ? (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={reportData.daily_revenue}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis
                              dataKey="date"
                              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                              tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                              }}
                            />
                            <YAxis
                              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                              tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                color: theme === 'dark' ? '#f3f4f6' : '#111827'
                              }}
                              labelStyle={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                              labelFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              }}
                            />
                            <Legend
                              wrapperStyle={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ fill: '#10b981', r: 4 }}
                              activeDot={{ r: 6 }}
                              name="Revenue"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className={`h-64 flex items-center justify-center rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No revenue data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Summary */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Monthly Summary</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Month</th>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total Orders</th>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {reportData.monthly_summary.map((monthData, index) => (
                          <tr key={index} className={index % 2 === 0 ? (theme === 'dark' ? 'bg-gray-800' : 'bg-white') : (theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50')}>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{monthData.month}</td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{formatCount(monthData.total_orders)}</td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>₹{formatCurrency(monthData.total_revenue, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No report data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
