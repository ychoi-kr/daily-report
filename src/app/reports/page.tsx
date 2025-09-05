'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReportListTable } from '@/components/reports/ReportListTable';
import { ReportSearchForm } from '@/components/reports/ReportSearchForm';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/simple-client';
import { DailyReportListItem } from '@/lib/schemas/report';
import { SalesPerson } from '@/lib/schemas/sales-person';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function ReportsPage() {
  const { user, isManager, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [reports, setReports] = useState<DailyReportListItem[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    per_page: 20,
    total_pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Search parameters
  const [searchParams, setSearchParams] = useState<{
    startDate?: string;
    endDate?: string;
    salesPersonId?: number;
  }>({});

  // Fetch sales persons for the filter (managers only)
  const fetchSalesPersons = useCallback(async () => {
    if (!isManager) return;
    
    try {
      const response = await api.salesPersons.getAll();
      setSalesPersons(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sales persons:', error);
      toast({
        title: 'エラー',
        description: '営業担当者の一覧取得に失敗しました',
        variant: 'destructive',
      });
    }
  }, [isManager, toast]);

  // Fetch reports
  const fetchReports = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        ...searchParams,
        page,
        per_page: 20,
      };
      
      const response = await api.reports.getAll(params);
      
      // Sort reports based on sortOrder
      const sortedReports = [...(response.data || [])].sort((a, b) => {
        const dateA = new Date(a.report_date).getTime();
        const dateB = new Date(b.report_date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
      
      setReports(sortedReports);
      setPagination(response.pagination || {
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast({
        title: 'エラー',
        description: '日報の取得に失敗しました',
        variant: 'destructive',
      });
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, sortOrder, toast]);

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchReports(1);
      fetchSalesPersons();
    }
  }, [user, fetchReports, fetchSalesPersons]);

  // Handle search
  const handleSearch = (params: {
    startDate?: string;
    endDate?: string;
    salesPersonId?: number;
  }) => {
    setSearchParams(params);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchReports(page);
  };

  // Handle sort
  const handleSortChange = (newOrder: 'asc' | 'desc') => {
    setSortOrder(newOrder);
  };

  // Handle new report creation
  const handleNewReport = () => {
    router.push('/reports/new');
  };

  // Effect to refetch when search params or sort order changes
  useEffect(() => {
    if (user) {
      fetchReports(pagination.page);
    }
  }, [searchParams, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

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
        {/* Header with New Report button */}
        <div className="flex items-center justify-between">
          <PageHeader title="日報一覧" />
          <Button onClick={handleNewReport} className="gap-2">
            <Plus className="h-4 w-4" />
            新規日報作成
          </Button>
        </div>

        {/* Search Form */}
        <ReportSearchForm
          onSearch={handleSearch}
          isManager={isManager}
          salesPersons={salesPersons}
          isLoading={isLoading}
        />

        {/* Reports Table */}
        <ReportListTable
          reports={reports}
          currentUserId={user.id}
          isManager={isManager}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && reports.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.total_pages}
            perPage={pagination.per_page}
            total={pagination.total}
            onPageChange={handlePageChange}
            className="mt-4"
          />
        )}
      </div>
    </DashboardLayout>
  );
};