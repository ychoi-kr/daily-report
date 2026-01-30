'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/lib/schemas/customer';
import type { VisitRecordInput } from '@/lib/schemas/report';

interface VisitRecordFormProps {
  visitRecords: VisitRecordInput[];
  onChange: (records: VisitRecordInput[]) => void;
  errors?: Record<string, string[]>;
}

export function VisitRecordForm({
  visitRecords,
  onChange,
  errors = {},
}: VisitRecordFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // 고객 리스트 가져오기
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        setCustomerError(null);

        const response = await fetch('/api/customers', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('고객 리스트를 가져오는 데 실패했습니다');
        }

        const data = await response.json();
        setCustomers(data.data || []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomerError('고객 리스트를 가져오는 데 실패했습니다');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // 방문 기록 추가
  const addVisitRecord = () => {
    const newRecord: VisitRecordInput = {
      customer_id: 0,
      visit_time: null,
      visit_content: '',
    };
    onChange([...visitRecords, newRecord]);
  };

  // 방문 기록 삭제
  const removeVisitRecord = (index: number) => {
    const updated = visitRecords.filter((_, i) => i !== index);
    onChange(updated);
  };

  // 방문 기록 업데이트
  const updateVisitRecord = (index: number, field: keyof VisitRecordInput, value: any) => {
    const updated = [...visitRecords];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  // 초기 방문 기록이 없는 경우 1개 추가
  useEffect(() => {
    if (visitRecords.length === 0) {
      addVisitRecord();
    }
  }, []);

  if (customerError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{customerError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">방문 기록</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVisitRecord}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          방문 기록 추가
        </Button>
      </div>

      {errors.visits && (
        <Alert variant="destructive">
          <AlertDescription>
            {Array.isArray(errors.visits) ? errors.visits[0] : errors.visits}
          </AlertDescription>
        </Alert>
      )}

      {visitRecords.map((record, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`customer-${index}`}>
                        고객명 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={record.customer_id?.toString() || ''}
                        onValueChange={(value) =>
                          updateVisitRecord(index, 'customer_id', parseInt(value, 10))
                        }
                        disabled={loadingCustomers}
                      >
                        <SelectTrigger id={`customer-${index}`}>
                          <SelectValue placeholder={loadingCustomers ? '로딩 중...' : '고객 선택'} />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.company_name} - {customer.contact_person}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`visits.${index}.customer_id`] && (
                        <p className="text-sm text-red-500" role="alert">
                          {errors[`visits.${index}.customer_id`][0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`visit-time-${index}`}>
                        <Clock className="inline h-4 w-4 mr-1" />
                        방문 시간 (선택)
                      </Label>
                      <Input
                        id={`visit-time-${index}`}
                        type="time"
                        value={record.visit_time || ''}
                        onChange={(e) =>
                          updateVisitRecord(index, 'visit_time', e.target.value || null)
                        }
                        placeholder="HH:MM"
                      />
                      {errors[`visits.${index}.visit_time`] && (
                        <p className="text-sm text-red-500" role="alert">
                          {errors[`visits.${index}.visit_time`][0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`visit-content-${index}`}>
                      방문 내용 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`visit-content-${index}`}
                      value={record.visit_content}
                      onChange={(e) =>
                        updateVisitRecord(index, 'visit_content', e.target.value)
                      }
                      placeholder="방문 내용을 입력하세요 (최대 500자)"
                      maxLength={500}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        {errors[`visits.${index}.visit_content`] && (
                          <p className="text-sm text-red-500" role="alert">
                            {errors[`visits.${index}.visit_content`][0]}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {record.visit_content.length}/500자
                      </p>
                    </div>
                  </div>
                </div>

                {visitRecords.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVisitRecord(index)}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">방문 기록 삭제</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {visitRecords.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>방문 기록이 없습니다.</p>
            <p className="mt-2">&quot;방문 기록 추가&quot; 버튼을 클릭하여 추가하세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}