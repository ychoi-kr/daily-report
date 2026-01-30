'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, isManager, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // 권한 확인: 관리자가 아닌 경우 리다이렉트
  useEffect(() => {
    // 인증 정보 로딩 중에는 아무것도 하지 않음
    if (!user) return;

    if (!isAuthenticated) {
      router.push('/login');
    } else if (!isManager) {
      toast({
        title: '접근 거부',
        description: '이 기능에 대한 접근 권한이 없습니다',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [user, isAuthenticated, isManager, router, toast]);

  // 영업 담당자 목록 가져오기
  const fetchSalesPersons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales-persons');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || '영업 담당자를 가져오는 데 실패했습니다'
        );
      }

      setSalesPersons(data.data);
    } catch (error) {
      console.error('Error fetching sales persons:', error);
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '영업 담당자를 가져오는 데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPersons();
  }, []);

  // 검색 필터링
  const filteredSalesPersons = salesPersons?.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.department.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // 계정 활성/비활성 전환
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
          data.error?.message || '계정 상태 변경에 실패했습니다'
        );
      }

      toast({
        title: '성공',
        description: `${person.name}의 계정을 ${isActive ? '활성화' : '비활성화'}했습니다`,
      });

      await fetchSalesPersons();
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '계정 상태 변경에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 관리자가 아닌 경우 아무것도 표시하지 않음
  if (!isManager) {
    return null;
  }

  return (
    <DashboardLayout
      isManager={isManager}
      userName={user?.name || ''}
      onLogout={logout}
    >
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">영업 담당자 관리</h1>
          <p className="text-gray-600">
            영업 담당자 등록/편집/권한 관리를 수행합니다
          </p>
        </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 이메일, 부서로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          신규 등록
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {loading
              ? '로딩 중...'
              : `${filteredSalesPersons.length}명의 영업 담당자`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>권한</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">작업</TableHead>
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
                    <Badge variant="default">관리자</Badge>
                  ) : (
                    <Badge variant="secondary">일반</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {person.is_active ? (
                    <Badge variant="outline" className="text-green-600">
                      활성
                    </Badge>
                  ) : (
                    <Badge variant="destructive">비활성</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">메뉴 열기</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>작업</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setEditingPerson(person)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        편집
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setResetPasswordPerson(person)}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        비밀번호 재설정
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          toggleAccountStatus(person, !person.is_active)
                        }
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        {person.is_active ? '계정 비활성화' : '계정 활성화'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredSalesPersons.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  영업 담당자를 찾을 수 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 다이얼로그 컴포넌트 */}
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