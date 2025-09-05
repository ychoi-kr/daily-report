'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, Edit, Calendar, User, Building, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import type { DailyReportDetail, ManagerComment } from '@/lib/schemas/report';

interface ReportDetailPageProps {
  params: {
    id: string;
  };
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const router = useRouter();
  const [report, setReport] = useState<DailyReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // コメント関連
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // 認証チェックとユーザー情報取得
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
          }
          throw new Error('認証に失敗しました');
        }
        const userData = await response.json();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('認証チェックに失敗しました');
      }
    };

    checkAuth();
  }, [router]);

  // 日報詳細取得
  const fetchReportDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('日報が見つかりません');
        }
        throw new Error('日報の取得に失敗しました');
      }

      const data: DailyReportDetail = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch report detail:', error);
      setError(error instanceof Error ? error.message : '日報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 日報詳細を取得
  useEffect(() => {
    if (currentUser) {
      fetchReportDetail();
    }
  }, [currentUser, params.id]);

  // コメント投稿
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setCommentError('コメントを入力してください');
      return;
    }

    if (newComment.length > 500) {
      setCommentError('コメントは500文字以内で入力してください');
      return;
    }

    try {
      setSubmittingComment(true);
      setCommentError(null);

      const response = await fetch(`/api/reports/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: newComment }),
      });

      if (!response.ok) {
        throw new Error('コメントの投稿に失敗しました');
      }

      // コメント追加成功
      setNewComment('');
      // 日報を再取得してコメントを更新
      await fetchReportDetail();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      setCommentError(error instanceof Error ? error.message : 'コメントの投稿に失敗しました');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 編集画面へ
  const handleEdit = () => {
    router.push(`/reports/${params.id}/edit`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">日報を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>{error || '日報が見つかりません'}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Link href="/reports">
              <Button variant="outline">日報一覧へ戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === report.sales_person.id;
  const isManager = currentUser?.is_manager;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              日報一覧へ戻る
            </Button>
          </Link>
          {isOwner && (
            <Button onClick={handleEdit} size="sm">
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          )}
        </div>

        {/* 基本情報 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>日報詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">日付</Label>
                  <p className="font-medium">
                    {format(new Date(report.report_date), 'yyyy年M月d日(E)', { locale: ja })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">作成者</Label>
                  <p className="font-medium">{report.sales_person.name}</p>
                  <p className="text-xs text-muted-foreground">{report.sales_person.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 訪問記録 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>訪問記録</CardTitle>
          </CardHeader>
          <CardContent>
            {report.visits.length === 0 ? (
              <p className="text-muted-foreground">訪問記録がありません</p>
            ) : (
              <div className="space-y-4">
                {report.visits.map((visit, index) => (
                  <div key={visit.id} className="border-l-4 border-primary pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{visit.customer.company_name}</span>
                          {visit.visit_time && (
                            <>
                              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                              <span className="text-sm text-muted-foreground">
                                {visit.visit_time}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{visit.visit_content}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 本日の課題・相談（Problem） */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>本日の課題・相談（Problem）</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{report.problem}</p>
          </CardContent>
        </Card>

        {/* 明日の計画（Plan） */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>明日の計画（Plan）</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{report.plan}</p>
          </CardContent>
        </Card>

        {/* 上長コメント */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              上長コメント
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 既存のコメント表示 */}
            {report.comments.length > 0 && (
              <div className="space-y-4 mb-6">
                {report.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-muted pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{comment.manager.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(comment.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {report.comments.length === 0 && !isManager && (
              <p className="text-muted-foreground mb-6">コメントはまだありません</p>
            )}

            {/* コメント投稿フォーム（管理者のみ） */}
            {isManager && (
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment">コメントを追加</Label>
                  <Textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="コメントを入力してください（最大500文字）"
                    maxLength={500}
                    rows={3}
                    className="resize-none"
                    disabled={submittingComment}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      {commentError && (
                        <p className="text-sm text-red-500">{commentError}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{newComment.length}/500文字</p>
                  </div>
                </div>
                <Button type="submit" disabled={submittingComment}>
                  {submittingComment ? '投稿中...' : '投稿'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* メタ情報 */}
        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>
            作成日時: {format(new Date(report.created_at), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
          </p>
          <p>
            更新日時: {format(new Date(report.updated_at), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
          </p>
        </div>
      </div>
    </div>
  );
}