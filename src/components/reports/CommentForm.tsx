'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, ApiError } from '@/lib/api/simple-client';

interface CommentFormProps {
  reportId: number;
  onCommentAdded: () => void;
  isManager: boolean;
}

export function CommentForm({ reportId, onCommentAdded, isManager }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isManager) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      setError('코멘트를 입력하세요');
      return;
    }

    if (comment.length > 500) {
      setError('코멘트는 500자 이내로 입력하세요');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.reports.addComment(reportId, comment);
      setComment('');
      onCommentAdded();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('코멘트 등록에 실패했습니다');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">코멘트 추가</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="comment">코멘트</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="코멘트를 입력하세요"
              className="min-h-[100px] mt-1"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {comment.length}/500자
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting || !comment.trim()}>
            {isSubmitting ? '등록 중...' : '등록'}
          </Button>
        </form>
      </div>
    </div>
  );
}