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
  const { user, isManager } = useAuth();
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
    if (user && !isManager) {
      window.location.href = '/dashboard';
    }
  }, [user, isManager]);

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
        title: 'エラー',
        description: '顧客情報の取得に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      await createCustomer(formData);
      toast({
        title: '成功',
        description: '顧客情報を登録しました',
      });
      setIsCreateDialogOpen(false);
      loadCustomers();
    } catch (error) {
      toast({
        title: 'エラー',
        description: '顧客情報の登録に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!selectedCustomer) return;
    
    try {
      await updateCustomer(selectedCustomer.id, formData);
      toast({
        title: '成功',
        description: '顧客情報を更新しました',
      });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      toast({
        title: 'エラー',
        description: '顧客情報の更新に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      await deleteCustomer(selectedCustomer.id);
      toast({
        title: '成功',
        description: '顧客情報を削除しました',
      });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      toast({
        title: 'エラー',
        description: '顧客情報の削除に失敗しました',
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
      title: 'エクスポート',
      description: 'エクスポート機能は現在開発中です',
    });
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    toast({
      title: 'インポート',
      description: 'インポート機能は現在開発中です',
    });
  };

  if (!isManager) {
    return (
      <DashboardLayout
        isManager={isManager}
        userName={user?.name}
        onLogout={() => {}}
      >
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-lg text-muted-foreground">
            このページへのアクセス権限がありません
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      isManager={isManager}
      userName={user?.name}
      onLogout={() => {}}
    >
      <div className="space-y-6">
        <PageHeader
          title="顧客マスタ管理"
          description="顧客情報の管理を行います"
        />

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="会社名・担当者名で検索"
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
              インポート
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <FileDown className="mr-2 h-4 w-4" />
              エクスポート
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              新規登録
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