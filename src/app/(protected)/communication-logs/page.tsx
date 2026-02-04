"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { makeAuthenticatedRequest } from "@/utils/api";
import { RoleGuard } from "@/components/RoleGuard";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import ListPageHeader from "@/components/ListPageHeader";
import {
  MessageSquare,
  Smartphone,
  Bell,
  Mail,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CommunicationLog {
  log_id: number;
  notification_id: number | null;
  notification_title: string | null;
  notification_type: string | null;
  event_type: string | null;
  store_id: number;
  branch_id: number | null;
  branch_name: string | null;
  recipient_type: string;
  recipient_id: number;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  channel: "sms" | "push" | "whatsapp" | "email";
  message_content: string;
  message_id: string | null;
  status: "pending" | "sent" | "delivered" | "failed" | "read";
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  error_message: string | null;
  created_at: string;
  order_id: number | null;
  order_number: string | null;
}

export default function CommunicationLogsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const [stats, setStats] = useState<{
    sms: Record<string, number>;
    push: Record<string, number>;
    whatsapp: Record<string, number>;
    email: Record<string, number>;
  } | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [
    currentPage,
    channelFilter,
    statusFilter,
    dateFrom,
    dateTo,
    searchTerm,
    user?.store_id,
  ]);

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        store_id: user?.store_id?.toString() || "",
      });

      if (channelFilter !== "all") {
        params.append("channel", channelFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (dateFrom) {
        params.append("date_from", dateFrom);
      }
      if (dateTo) {
        params.append("date_to", dateTo);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await makeAuthenticatedRequest(
        `/communication-logs/stats?${params.toString()}`,
        {},
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        setStats(response.data || null);
      }
    } catch (err) {
      console.error("Error fetching communication stats:", err);
    }
  };

  const sumChannel = (channelKey: keyof NonNullable<typeof stats>) => {
    if (!stats?.[channelKey]) return 0;
    return Object.values(stats[channelKey]).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0
    );
  };

  const smsCount = sumChannel("sms");
  const pushCount = sumChannel("push");
  const deliveredCount =
    (stats?.sms?.delivered || 0) +
    (stats?.sms?.read || 0) +
    (stats?.push?.delivered || 0) +
    (stats?.push?.read || 0);

  const totalLogsSummary =
    channelFilter === "sms"
      ? smsCount
      : channelFilter === "push"
      ? pushCount
      : smsCount + pushCount;

  const normalizeDateRange = (nextFrom: string, nextTo: string) => {
    if (nextFrom && nextTo && nextFrom > nextTo) {
      return { from: nextFrom, to: nextFrom };
    }
    return { from: nextFrom, to: nextTo };
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        store_id: user?.store_id?.toString() || "",
      });

      if (channelFilter !== "all") {
        params.append("channel", channelFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (dateFrom) {
        params.append("date_from", dateFrom);
      }
      if (dateTo) {
        params.append("date_to", dateTo);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await makeAuthenticatedRequest(
        `/communication-logs?${params.toString()}`,
        {},
        true,
        user?.store_id,
        user?.branch_id || undefined
      );

      if (response.success) {
        setLogs(response.data || []);
        setTotalPages(response.pagination?.total_pages || 1);
        setTotalCount(response.pagination?.total || 0);
      } else {
        throw new Error(
          response.message || "Failed to fetch communication logs"
        );
      }
    } catch (err) {
      console.error("Error fetching communication logs:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch communication logs"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "push":
        return <Bell className="h-4 w-4" />;
      case "whatsapp":
        return <Smartphone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "sent":
        return (
          <span
            className={`${baseClasses} ${
              isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
            }`}
          >
            Sent
          </span>
        );
      case "delivered":
        return (
          <span
            className={`${baseClasses} ${
              isDark
                ? "bg-green-900 text-green-200"
                : "bg-green-100 text-green-800"
            }`}
          >
            Delivered
          </span>
        );
      case "read":
        return (
          <span
            className={`${baseClasses} ${
              isDark
                ? "bg-purple-900 text-purple-200"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            Read
          </span>
        );
      case "failed":
        return (
          <span
            className={`${baseClasses} ${
              isDark ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
            }`}
          >
            Failed
          </span>
        );
      case "pending":
        return (
          <span
            className={`${baseClasses} ${
              isDark
                ? "bg-yellow-900 text-yellow-200"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            Pending
          </span>
        );
      default:
        return (
          <span
            className={`${baseClasses} ${
              isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800"
            }`}
          >
            {status}
          </span>
        );
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <FeatureGuard
      feature="communication_logs_enabled"
      fallback={
        <div className="p-6 text-center">
          <div className="border rounded-lg px-4 py-3 mb-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              Communication logs feature is disabled for this store. Please
              contact support to enable it.
            </p>
          </div>
        </div>
      }
    >
      <RoleGuard
        requiredPermissions={["manage_communication_logs"]}
        fallback={
          <div className="p-6 text-center">
            <div className="border rounded-lg px-4 py-3 mb-4">
              <p className="text-red-700 dark:text-red-300">
                Access denied. You do not have permission to view communication
                logs.
              </p>
            </div>
          </div>
        }
      >
        <div
          className={` ${
            isDark ? "bg-gray-900" : "bg-gray-50"
          } min-h-screen`}
        >
          <ListPageHeader
            title="Communication Logs"
            subtitle="View SMS and push notification details, delivery status, and recipient information."
          />
          <div className="max-w-7xl mx-auto">

            {/* Filters */}
            <div
              className={`mb-6 ${
                isDark ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-sm p-4`}
            >
              <div className="flex flex-wrap gap-4 items-end">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Search
                  </label>
                  <div className="relative">
                    <Search
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search by message, phone, name, email..."
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                {/* Channel Filter */}
                <div className="min-w-[150px]">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Channel
                  </label>
                  <select
                    value={channelFilter}
                    onChange={(e) => {
                      setChannelFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="all">All Channels</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="min-w-[150px]">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="read">Read</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Date From */}
                <div className="min-w-[150px]">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      const nextFrom = e.target.value;
                      const { from, to } = normalizeDateRange(
                        nextFrom,
                        dateTo
                      );
                      setDateFrom(from);
                      setDateTo(to);
                      setCurrentPage(1);
                    }}
                    max={dateTo || undefined}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                {/* Date To */}
                <div className="min-w-[150px]">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      const nextTo = e.target.value;
                      const { from, to } = normalizeDateRange(
                        dateFrom,
                        nextTo
                      );
                      setDateFrom(from);
                      setDateTo(to);
                      setCurrentPage(1);
                    }}
                    min={dateFrom || undefined}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-white"
                } shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Logs
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {totalLogsSummary}
                    </p>
                  </div>
                  <MessageSquare
                    className={`h-8 w-8 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                </div>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-white"
                } shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      SMS
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {smsCount}
                    </p>
                  </div>
                  <MessageSquare
                    className={`h-8 w-8 ${
                      isDark ? "text-green-400" : "text-green-600"
                    }`}
                  />
                </div>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-white"
                } shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Push Notifications
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {pushCount}
                    </p>
                  </div>
                  <Bell
                    className={`h-8 w-8 ${
                      isDark ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                </div>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-white"
                } shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Delivered
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {deliveredCount}
                    </p>
                  </div>
                  <CheckCircle
                    className={`h-8 w-8 ${
                      isDark ? "text-green-400" : "text-green-600"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Logs Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p
                  className={`mt-4 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Loading communication logs...
                </p>
              </div>
            ) : error ? (
              <div
                className={`p-4 rounded-lg ${
                  isDark
                    ? "bg-red-900 bg-opacity-20 border border-red-800"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className={isDark ? "text-red-400" : "text-red-600"}>
                  {error}
                </p>
              </div>
            ) : logs.length === 0 ? (
              <div
                className={`p-12 text-center rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                <MessageSquare
                  className={`h-12 w-12 mx-auto mb-4 ${
                    isDark ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                  No communication logs found
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`rounded-lg shadow-sm overflow-hidden ${
                    isDark ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
                        <tr>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Channel
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Recipient
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Message
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Status
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Sent At
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Delivered At
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Order
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          isDark ? "divide-gray-700" : "divide-gray-200"
                        }`}
                      >
                        {logs.map((log) => (
                          <tr
                            key={log.log_id}
                            className={
                              isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-2 rounded ${
                                    isDark ? "bg-gray-700" : "bg-gray-100"
                                  }`}
                                >
                                  {getChannelIcon(log.channel)}
                                </div>
                                <span
                                  className={`font-medium ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {log.channel.toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <div>
                                <div className="font-medium">
                                  {log.recipient_name}
                                </div>
                                {log.recipient_phone && (
                                  <div className="text-xs text-gray-500">
                                    {log.recipient_phone}
                                  </div>
                                )}
                                {log.recipient_email && (
                                  <div className="text-xs text-gray-500">
                                    {log.recipient_email}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  {log.recipient_type}
                                </div>
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <div className="max-w-md">
                                <p className="text-sm line-clamp-2">
                                  {log.message_content}
                                </p>
                                {log.notification_title && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Title: {log.notification_title}
                                  </p>
                                )}
                                {log.error_message && (
                                  <p className="text-xs text-red-500 mt-1">
                                    Error: {log.error_message}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(log.status)}
                            </td>
                            <td
                              className={`px-6 py-4 text-sm ${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              {formatDate(log.sent_at)}
                            </td>
                            <td
                              className={`px-6 py-4 text-sm ${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              {formatDate(log.delivered_at)}
                              {log.opened_at && (
                                <div className="text-xs text-purple-500 mt-1">
                                  Opened: {formatDate(log.opened_at)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {log.order_number ? (
                                <button
                                  onClick={() =>
                                    router.push(`/orders/${log.order_id}`)
                                  }
                                  className="text-blue-600 hover:text-blue-900 text-sm font-mono"
                                >
                                  {log.order_number}
                                </button>
                              ) : (
                                <span
                                  className={`text-sm ${
                                    isDark ? "text-gray-500" : "text-gray-400"
                                  }`}
                                >
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-4 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalCount)}
                      </span>{" "}
                      of <span className="font-medium">{totalCount}</span>{" "}
                      results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-indigo-50 text-indigo-600 border border-indigo-500 dark:bg-indigo-600 dark:text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </RoleGuard>
    </FeatureGuard>
  );
}
