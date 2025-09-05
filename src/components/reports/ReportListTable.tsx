'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { DailyReportListItem } from '@/lib/schemas/report';
import { MessageCircle, Edit, Eye, ChevronUp, ChevronDown } from 'lucide-react';

interface ReportListTableProps {
  reports: DailyReportListItem[];
  currentUserId?: number;
  isManager?: boolean;
  sortOrder: 'asc' | 'desc';
  onSortChange: (order: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

export const ReportListTable: React.FC<ReportListTableProps> = ({
  reports,
  currentUserId,
  isManager,
  sortOrder,
  onSortChange,
  isLoading,
}) => {
  const router = useRouter();

  const handleSort = () => {
    onSortChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleViewDetails = (reportId: number) => {
    router.push(`/reports/${reportId}`);
  };

  const handleEdit = (reportId: number) => {
    router.push(`/reports/${reportId}/edit`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'M/d (E)', { locale: ja });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            データを読み込み中...
          </div>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="border rounded-lg p-8">
        <div className="text-center text-muted-foreground">
          表示する日報がありません
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSort}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                日付
                {sortOrder === 'asc' ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            </TableHead>
            <TableHead>営業担当</TableHead>
            <TableHead>訪問件数</TableHead>
            <TableHead>コメント</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const isOwnReport = currentUserId === report.sales_person.id;
            const canEdit = isOwnReport && !isManager;

            return (
              <TableRow key={report.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {formatDate(report.report_date)}
                </TableCell>
                <TableCell>{report.sales_person.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{report.visit_count}</span>
                    <span className="text-muted-foreground">件</span>
                  </div>
                </TableCell>
                <TableCell>
                  {report.has_comments ? (
                    <Badge variant="secondary" className="gap-1">
                      <MessageCircle className="h-3 w-3" />
                      あり
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetails(report.id)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      詳細
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(report.id)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        編集
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};