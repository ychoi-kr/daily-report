'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
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

  // 폼 데이터
  const [visitRecords, setVisitRecords] = useState<VisitRecordInput[]>(
    initialData?.visits || []
  );
  const [problem, setProblem] = useState(initialData?.problem || '');
  const [plan, setPlan] = useState(initialData?.plan || '');

  // 자동 저장용 (선택 기능)
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // 폼 변경 감지
  useEffect(() => {
    if (visitRecords.length > 0 || problem || plan) {
      setIsDirty(true);
    }
  }, [visitRecords, problem, plan]);

  // 자동 저장 (임시 저장) - localStorage 사용
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
    }, 2000); // 2초 후 자동 저장

    return () => clearTimeout(saveTimeout);
  }, [visitRecords, problem, plan, reportDate, isDirty]);

  // 임시 저장 불러오기
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

  // 유효성 검사
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

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('입력 내용에 오류가 있습니다. 확인해주세요.');
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

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf-token='))
        ?.split('=')[1];

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('같은 날짜의 일일 보고가 이미 존재합니다');
        } else if (response.status === 401) {
          throw new Error('로그인이 필요합니다');
        } else if (data.error?.message) {
          throw new Error(data.error.message);
        } else {
          throw new Error('일일 보고 작성에 실패했습니다');
        }
      }

      // 성공 시 임시 저장 삭제
      localStorage.removeItem('report-draft');

      // 목록 화면으로 이동
      router.push('/reports');
    } catch (error) {
      console.error('Report submission error:', error);
      setError(error instanceof Error ? error.message : '일일 보고 작성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소 처리
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        '편집 중인 내용이 사라집니다. 계속하시겠습니까?'
      );
      if (!confirmed) return;
    }

    if (onCancel) {
      onCancel();
    } else {
      router.push('/reports');
    }
  };

  // 현재 사용자 정보 가져오기
  const [userName, setUserName] = useState('');
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUserName(data.name || ''))
      .catch(() => setUserName(''));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 헤더 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>일일 보고 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>날짜</Label>
              <p className="text-lg font-medium">
                {format(new Date(reportDate), 'yyyy년 M월 d일(E)', { locale: ko })}
              </p>
            </div>
            <div>
              <Label>작성자</Label>
              <p className="text-lg font-medium">{userName || '로딩 중...'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 오류 표시 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 방문 기록 섹션 */}
      <VisitRecordForm
        visitRecords={visitRecords}
        onChange={setVisitRecords}
        errors={validationErrors}
      />

      {/* 오늘의 과제/상담 (Problem) */}
      <Card>
        <CardHeader>
          <CardTitle>오늘의 과제/상담 (Problem)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="problem">
              과제/상담 사항 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="오늘의 과제나 상담 사항을 입력하세요 (최대 1000자)"
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
              <p className="text-xs text-muted-foreground">{problem.length}/1000자</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내일 계획 (Plan) */}
      <Card>
        <CardHeader>
          <CardTitle>내일 계획 (Plan)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="plan">
              내일 활동 계획 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="내일 활동 계획을 입력하세요 (최대 1000자)"
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
              <p className="text-xs text-muted-foreground">{plan.length}/1000자</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 자동 저장 상태 */}
      {lastSaved && (
        <div className="text-sm text-muted-foreground text-center">
          {isAutoSaving ? (
            <span>저장 중...</span>
          ) : (
            <span>
              마지막 저장: {format(lastSaved, 'HH:mm:ss', { locale: ko })}
            </span>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              저장
            </>
          )}
        </Button>
      </div>
    </form>
  );
}