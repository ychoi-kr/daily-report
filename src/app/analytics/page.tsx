'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/simple-client';
import { useToast } from '@/components/ui/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Building,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AnalyticsData {
  totalReports: number;
  totalVisits: number;
  activeUsers: number;
  topCustomers: Array<{ name: string; visits: number }>;
  reportsByDate: Array<{ date: string; count: number }>;
  visitsByCustomer: Array<{ customer: string; visits: number }>;
  userActivity: Array<{ user: string; reports: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { user, isManager, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalReports: 0,
    totalVisits: 0,
    activeUsers: 0,
    topCustomers: [],
    reportsByDate: [],
    visitsByCustomer: [],
    userActivity: []
  });

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch reports
      const reportsResponse = await api.reports.getAll({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      const reports = reportsResponse.data || [];
      
      // Calculate analytics
      const totalReports = reports.length;
      const totalVisits = reports.reduce((sum: number, report: any) => sum + (report.visit_count || 0), 0);
      const activeUsers = new Set(reports.map((r: any) => r.sales_person?.id)).size;

      // Reports by date
      const reportsByDateMap = new Map<string, number>();
      reports.forEach((report: any) => {
        const date = format(new Date(report.report_date), 'MM/dd');
        reportsByDateMap.set(date, (reportsByDateMap.get(date) || 0) + 1);
      });
      const reportsByDate = Array.from(reportsByDateMap, ([date, count]) => ({ date, count }));

      // Mock data for demonstration (in real app, this would come from API)
      const topCustomers = [
        { name: 'ABC상사', visits: 15 },
        { name: 'XYZ공업', visits: 12 },
        { name: 'DEF상사', visits: 10 },
        { name: 'GHI제조', visits: 8 },
        { name: 'JKL물산', visits: 6 }
      ];

      const visitsByCustomer = topCustomers.map(c => ({
        customer: c.name,
        visits: c.visits
      }));

      const userActivity = [
        { user: '김영수', reports: 25 },
        { user: '이미영', reports: 20 },
        { user: '박철수', reports: 18 },
        { user: '최지영', reports: 15 },
      ];

      setAnalyticsData({
        totalReports,
        totalVisits,
        activeUsers,
        topCustomers,
        reportsByDate,
        visitsByCustomer,
        userActivity
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast({
        title: '오류',
        description: '분석 데이터를 가져오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportData = () => {
    toast({
      title: '내보내기 시작',
      description: '보고서를 다운로드하고 있습니다...',
    });
    // TODO: Implement actual export functionality
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      isManager={isManager}
      userName={user.name}
      onLogout={logout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title="분석 · 보고서"
            description="영업 활동 분석 및 보고서"
          />
          <div className="flex gap-2">
            <DatePickerWithRange
              from={dateRange.from}
              to={dateRange.to}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                }
              }}
            />
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                일일 보고 총 수
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                기간 내 일일 보고 수
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                방문 건수
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalVisits}</div>
              <p className="text-xs text-muted-foreground">
                기간 내 총 방문 수
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                활성 사용자
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                일일 보고를 작성한 사용자
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                평균 방문 수
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.totalReports > 0
                  ? (analyticsData.totalVisits / analyticsData.totalReports).toFixed(1)
                  : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                일일 보고당 방문 수
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Daily Reports Chart */}
          <Card>
            <CardHeader>
              <CardTitle>일별 일일 보고 작성 수</CardTitle>
              <CardDescription>기간 내 일일 보고 작성 추이</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.reportsByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="보고 수"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Customers Chart */}
          <Card>
            <CardHeader>
              <CardTitle>고객별 방문 수</CardTitle>
              <CardDescription>방문 횟수 상위 고객</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.visitsByCustomer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="customer" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visits" fill="#8884d8" name="방문 수" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>사용자별 활동 현황</CardTitle>
              <CardDescription>영업 담당자의 일일 보고 작성 수</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.userActivity} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="user" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reports" fill="#82ca9d" name="보고 수" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Visit Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>방문처 분포</CardTitle>
              <CardDescription>고객별 방문 비율</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.topCustomers}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${entry.visits}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="visits"
                  >
                    {analyticsData.topCustomers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}