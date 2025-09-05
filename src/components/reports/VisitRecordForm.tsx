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

  // 顧客リストを取得
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        setCustomerError(null);
        
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error('顧客リストの取得に失敗しました');
        }
        
        const data = await response.json();
        setCustomers(data.data || []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomerError('顧客リストの取得に失敗しました');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // 訪問記録を追加
  const addVisitRecord = () => {
    const newRecord: VisitRecordInput = {
      customer_id: 0,
      visit_time: null,
      visit_content: '',
    };
    onChange([...visitRecords, newRecord]);
  };

  // 訪問記録を削除
  const removeVisitRecord = (index: number) => {
    const updated = visitRecords.filter((_, i) => i !== index);
    onChange(updated);
  };

  // 訪問記録を更新
  const updateVisitRecord = (index: number, field: keyof VisitRecordInput, value: any) => {
    const updated = [...visitRecords];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  // 初期の訪問記録がない場合、1つ追加
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
        <h3 className="text-lg font-semibold">訪問記録</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVisitRecord}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          訪問記録を追加
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
                        顧客名 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={record.customer_id?.toString() || ''}
                        onValueChange={(value) =>
                          updateVisitRecord(index, 'customer_id', parseInt(value, 10))
                        }
                        disabled={loadingCustomers}
                      >
                        <SelectTrigger id={`customer-${index}`}>
                          <SelectValue placeholder={loadingCustomers ? '読み込み中...' : '顧客を選択'} />
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
                        <p className="text-sm text-red-500">
                          {errors[`visits.${index}.customer_id`][0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`visit-time-${index}`}>
                        <Clock className="inline h-4 w-4 mr-1" />
                        訪問時刻（任意）
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
                        <p className="text-sm text-red-500">
                          {errors[`visits.${index}.visit_time`][0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`visit-content-${index}`}>
                      訪問内容 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`visit-content-${index}`}
                      value={record.visit_content}
                      onChange={(e) =>
                        updateVisitRecord(index, 'visit_content', e.target.value)
                      }
                      placeholder="訪問内容を入力してください（最大500文字）"
                      maxLength={500}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        {errors[`visits.${index}.visit_content`] && (
                          <p className="text-sm text-red-500">
                            {errors[`visits.${index}.visit_content`][0]}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {record.visit_content.length}/500文字
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
                    <span className="sr-only">訪問記録を削除</span>
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
            <p>訪問記録がありません。</p>
            <p className="mt-2">「訪問記録を追加」ボタンをクリックして追加してください。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}