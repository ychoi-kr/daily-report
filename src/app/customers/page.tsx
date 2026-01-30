'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { DeleteConfirmDialog } from '@/components/customers/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/lib/api/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/lib/types/customer';
import { Search, Plus, FileDown, FileUp } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function CustomersPage() {
  const { user, isManager, logout } = useAuth();
  const { toast } = useToast();
  const { data, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Redirect non-managers
  useEffect(() => {
    // Wait for user info to load
    if (!user) return;
    
    if (!isManager) {
      toast({
        title: '접근 거부',
        description: '이 기능에 대한 접근 권한이 없습니다',
        variant: 'destructive',
      });
      window.location.href = '/dashboard';
    }
  }, [user, isManager, toast]);

  // Fetch customers on mount and when search/page changes
  useEffect(() => {
    loadCustomers();
  }, [debouncedSearchTerm, currentPage]);

  const loadCustomers = async () => {
    try {
      await fetchCustomers({
        search: debouncedSearchTerm,
        page: currentPage,
        per_page: 10,
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '고객 정보를 가져오는 데 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      await createCustomer(formData);
      toast({
        title: '성공',
        description: '고객 정보를 등록했습니다',
      });
      setIsCreateDialogOpen(false);
      loadCustomers();
    } catch (error) {
      toast({
        title: '오류',
        description: '고객 정보 등록에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!selectedCustomer) return;

    try {
      await updateCustomer(selectedCustomer.id, formData);
      toast({
        title: '성공',
        description: '고객 정보를 업데이트했습니다',
      });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      toast({
        title: '오류',
        description: '고객 정보 업데이트에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      await deleteCustomer(selectedCustomer.id);
      toast({
        title: '성공',
        description: '고객 정보를 삭제했습니다',
      });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      toast({
        title: '오류',
        description: '고객 정보 삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: '내보내기',
      description: '내보내기 기능은 현재 개발 중입니다',
    });
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    toast({
      title: '가져오기',
      description: '가져오기 기능은 현재 개발 중입니다',
    });
  };

  if (!isManager) {
    return (
      <DashboardLayout
        isManager={isManager}
        userName={user?.name}
        onLogout={logout}
      >
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-lg text-muted-foreground">
            이 페이지에 대한 접근 권한이 없습니다
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      isManager={isManager}
      userName={user?.name}
      onLogout={logout}
    >
      <div className="space-y-6">
        <PageHeader
          title="고객 마스터 관리"
          description="고객 정보를 관리합니다"
        />

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="회사명/담당자명으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
            >
              <FileUp className="mr-2 h-4 w-4" />
              가져오기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <FileDown className="mr-2 h-4 w-4" />
              내보내기
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              신규 등록
            </Button>
          </div>
        </div>

        {/* Customer Table */}
        <CustomerTable
          customers={data?.data || []}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          currentPage={currentPage}
          totalPages={data?.pagination?.total_pages || 1}
          onPageChange={setCurrentPage}
        />

        {/* Dialogs */}
        <CustomerFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreate}
          mode="create"
        />

        <CustomerFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          customer={selectedCustomer}
          onSubmit={handleUpdate}
          mode="edit"
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          customerName={selectedCustomer?.company_name}
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}