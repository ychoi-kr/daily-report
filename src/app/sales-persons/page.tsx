'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Plus,
  Search,
  Edit,
  Key,
  UserX,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewSalesPersonDialog } from '@/components/sales-persons/new-sales-person-dialog';
import { EditSalesPersonDialog } from '@/components/sales-persons/edit-sales-person-dialog';
import { PasswordResetDialog } from '@/components/sales-persons/password-reset-dialog';
import type { SalesPerson } from '@/types/api';

export default function SalesPersonsPage() {
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SalesPerson | null>(null);
  const [resetPasswordPerson, setResetPasswordPerson] =
    useState<SalesPerson | null>(null);
  const { toast } = useToast();

  // 営業担当者一覧を取得
  const fetchSalesPersons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales-persons');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || '営業担当者の取得に失敗しました'
        );
      }

      setSalesPersons(data.data);
    } catch (error) {
      console.error('Error fetching sales persons:', error);
      toast({
        title: 'エラー',
        description:
          error instanceof Error
            ? error.message
            : '営業担当者の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPersons();
  }, []);

  // 検索フィルタリング
  const filteredSalesPersons = salesPersons.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // アカウントの有効/無効を切り替え
  const toggleAccountStatus = async (
    person: SalesPerson,
    isActive: boolean
  ) => {
    try {
      const response = await fetch(`/api/sales-persons/${person.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'アカウント状態の変更に失敗しました'
        );
      }

      toast({
        title: '成功',
        description: `${person.name}のアカウントを${isActive ? '有効' : '無効'}にしました`,
      });

      await fetchSalesPersons();
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast({
        title: 'エラー',
        description:
          error instanceof Error
            ? error.message
            : 'アカウント状態の変更に失敗しました',
        variant: 'destructive',
      });
    }
  };

  // TODO: 実際の認証状態とユーザー情報を取得
  const isManager = true; // 管理者のみアクセス可能
  const userName = '管理者';

  const handleLogout = () => {
    // TODO: ログアウト処理
    console.log('Logout clicked');
  };

  return (
    <DashboardLayout
      isManager={isManager}
      userName={userName}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">営業担当者管理</h1>
          <p className="text-gray-600">
            営業担当者の登録・編集・権限管理を行います
          </p>
        </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="氏名、メール、部署で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規登録
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {loading
              ? '読み込み中...'
              : `${filteredSalesPersons.length}名の営業担当者`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>部署</TableHead>
              <TableHead>権限</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSalesPersons.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell>{person.email}</TableCell>
                <TableCell>{person.department}</TableCell>
                <TableCell>
                  {person.is_manager ? (
                    <Badge variant="default">管理者</Badge>
                  ) : (
                    <Badge variant="secondary">一般</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {person.is_active ? (
                    <Badge variant="outline" className="text-green-600">
                      有効
                    </Badge>
                  ) : (
                    <Badge variant="destructive">無効</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">メニューを開く</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setEditingPerson(person)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        編集
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setResetPasswordPerson(person)}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        パスワードリセット
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          toggleAccountStatus(person, !person.is_active)
                        }
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        {person.is_active ? 'アカウント無効化' : 'アカウント有効化'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredSalesPersons.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  営業担当者が見つかりません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ダイアログコンポーネント */}
      <NewSalesPersonDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSuccess={fetchSalesPersons}
      />

      {editingPerson && (
        <EditSalesPersonDialog
          open={!!editingPerson}
          onOpenChange={(open) => !open && setEditingPerson(null)}
          salesPerson={editingPerson}
          onSuccess={fetchSalesPersons}
        />
      )}

      {resetPasswordPerson && (
        <PasswordResetDialog
          open={!!resetPasswordPerson}
          onOpenChange={(open) => !open && setResetPasswordPerson(null)}
          salesPerson={resetPasswordPerson}
        />
      )}
      </div>
    </DashboardLayout>
  );
}