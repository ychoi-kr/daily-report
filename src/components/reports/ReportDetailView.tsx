'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Report, Comment } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { VisitRecordList } from './VisitRecordList';
import { CommentHistory } from './CommentHistory';
import { CommentForm } from './CommentForm';
import { api, ApiError } from '@/lib/api/simple-client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  User, 
  Edit, 
  ArrowLeft,
  FileText,
  Target,
  AlertCircle
} from 'lucide-react';

interface ReportDetailViewProps {
  reportId: number;
}

export function ReportDetailView({ reportId }: ReportDetailViewProps) {
  const router = useRouter();
  const { user, isManager } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const reportData = await api.reports.getById(reportId);
      setReport(reportData);
      setComments(reportData.comments || []);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('일일 보고를 찾을 수 없습니다');
        } else if (err.status === 403) {
          setError('이 일일 보고를 볼 권한이 없습니다');
        } else {
          setError(err.message);
        }
      } else {
        setError('일일 보고를 가져오는 데 실패했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setIsRefreshing(true);
      const commentsData = await api.reports.getComments(reportId);
      setComments(commentsData.data || commentsData || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleCommentAdded = () => {
    fetchComments();
  };

  const handleEdit = () => {
    router.push(`/reports/${reportId}/edit`);
  };

  const handleBack = () => {
    router.push('/reports');
  };

  const isCreator = user && report && user.id === report.sales_person_id;

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">일일 보고 상세</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
            {isCreator && (
              <Button onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                편집
              </Button>
            )}
          </div>
        </div>

        {/* Report Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">날짜:</span>
                <span className="font-semibold">
                  {format(new Date(report.report_date), 'yyyy년 MM월 dd일(E)', {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">작성자:</span>
                <span className="font-semibold">
                  {report.sales_person?.name || '알 수 없음'}
                </span>
                {report.sales_person?.department && (
                  <span className="text-sm text-muted-foreground">
                    ({report.sales_person.department})
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit Records */}
        <VisitRecordList visits={report.visits || []} />

        {/* Problem Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              오늘의 과제/상담 (Problem)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{report.problem}</p>
          </CardContent>
        </Card>

        {/* Plan Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              내일 계획 (Plan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{report.plan}</p>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="space-y-6">
          <CommentHistory comments={comments} isLoading={isRefreshing} />
          <CommentForm
            reportId={reportId}
            onCommentAdded={handleCommentAdded}
            isManager={isManager}
          />
        </div>

        {/* Footer Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
              <div>
                작성일시:{' '}
                {format(new Date(report.created_at), 'yyyy/MM/dd HH:mm:ss', {
                  locale: ko,
                })}
              </div>
              <div>
                수정일시:{' '}
                {format(new Date(report.updated_at), 'yyyy/MM/dd HH:mm:ss', {
                  locale: ko,
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}