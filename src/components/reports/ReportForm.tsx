'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitRecordForm } from '@/components/reports/VisitRecordForm';
import {
  CreateReportRequestSchema,
  type CreateReportRequest,
  type VisitRecordInput,
} from '@/lib/schemas/report';
import { z } from 'zod';

interface ReportFormProps {
  reportDate?: string;
  initialData?: Partial<CreateReportRequest>;
  onCancel?: () => void;
}

export function ReportForm({
  reportDate = format(new Date(), 'yyyy-MM-dd'),
  initialData,
  onCancel,
}: ReportFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isDirty, setIsDirty] = useState(false);

  // フォームデータ
  const [visitRecords, setVisitRecords] = useState<VisitRecordInput[]>(
    initialData?.visits || []
  );
  const [problem, setProblem] = useState(initialData?.problem || '');
  const [plan, setPlan] = useState(initialData?.plan || '');

  // 自動保存用（オプション機能）
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // フォームの変更を検知
  useEffect(() => {
    if (visitRecords.length > 0 || problem || plan) {
      setIsDirty(true);
    }
  }, [visitRecords, problem, plan]);

  // 自動保存（下書き保存）- localStorage を使用
  useEffect(() => {
    if (!isDirty) return;

    const saveTimeout = setTimeout(() => {
      setIsAutoSaving(true);
      const draft = {
        reportDate,
        visitRecords,
        problem,
        plan,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('report-draft', JSON.stringify(draft));
      setLastSaved(new Date());
      setIsAutoSaving(false);
    }, 2000); // 2秒後に自動保存

    return () => clearTimeout(saveTimeout);
  }, [visitRecords, problem, plan, reportDate, isDirty]);

  // 下書き読み込み
  useEffect(() => {
    if (initialData) return;

    const savedDraft = localStorage.getItem('report-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.reportDate === reportDate) {
          setVisitRecords(draft.visitRecords || []);
          setProblem(draft.problem || '');
          setPlan(draft.plan || '');
          setLastSaved(new Date(draft.savedAt));
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [reportDate, initialData]);

  // バリデーション
  const validateForm = (): boolean => {
    try {
      const formData: CreateReportRequest = {
        report_date: reportDate,
        visits: visitRecords,
        problem,
        plan,
      };

      CreateReportRequestSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('入力内容に誤りがあります。確認してください。');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData: CreateReportRequest = {
        report_date: reportDate,
        visits: visitRecords,
        problem,
        plan,
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('同じ日付の日報が既に存在します');
        } else if (response.status === 401) {
          throw new Error('ログインが必要です');
        } else if (data.error?.message) {
          throw new Error(data.error.message);
        } else {
          throw new Error('日報の作成に失敗しました');
        }
      }

      // 成功時は下書きを削除
      localStorage.removeItem('report-draft');

      // 一覧画面へ遷移
      router.push('/reports');
    } catch (error) {
      console.error('Report submission error:', error);
      setError(error instanceof Error ? error.message : '日報の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        '編集中の内容が失われます。よろしいですか？'
      );
      if (!confirmed) return;
    }

    if (onCancel) {
      onCancel();
    } else {
      router.push('/reports');
    }
  };

  // 現在のユーザー情報を取得
  const [userName, setUserName] = useState('');
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUserName(data.name || ''))
      .catch(() => setUserName(''));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ヘッダー情報 */}
      <Card>
        <CardHeader>
          <CardTitle>日報作成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>日付</Label>
              <p className="text-lg font-medium">
                {format(new Date(reportDate), 'yyyy年M月d日(E)', { locale: ja })}
              </p>
            </div>
            <div>
              <Label>作成者</Label>
              <p className="text-lg font-medium">{userName || '読み込み中...'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 訪問記録セクション */}
      <VisitRecordForm
        visitRecords={visitRecords}
        onChange={setVisitRecords}
        errors={validationErrors}
      />

      {/* 本日の課題・相談（Problem） */}
      <Card>
        <CardHeader>
          <CardTitle>本日の課題・相談（Problem）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="problem">
              課題・相談事項 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="本日の課題や相談事項を入力してください（最大1000文字）"
              maxLength={1000}
              rows={6}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <div>
                {validationErrors.problem && (
                  <p className="text-sm text-red-500">{validationErrors.problem[0]}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{problem.length}/1000文字</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 明日の計画（Plan） */}
      <Card>
        <CardHeader>
          <CardTitle>明日の計画（Plan）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="plan">
              明日の活動計画 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="明日の活動計画を入力してください（最大1000文字）"
              maxLength={1000}
              rows={6}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <div>
                {validationErrors.plan && (
                  <p className="text-sm text-red-500">{validationErrors.plan[0]}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{plan.length}/1000文字</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 自動保存状態 */}
      {lastSaved && (
        <div className="text-sm text-muted-foreground text-center">
          {isAutoSaving ? (
            <span>保存中...</span>
          ) : (
            <span>
              最終保存: {format(lastSaved, 'HH:mm:ss', { locale: ja })}
            </span>
          )}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存
            </>
          )}
        </Button>
      </div>
    </form>
  );
}