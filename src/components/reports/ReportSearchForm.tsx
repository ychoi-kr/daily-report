'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, RotateCcw } from 'lucide-react';
import { SalesPerson } from '@/lib/schemas/sales-person';
import { format } from 'date-fns';

interface ReportSearchFormProps {
  onSearch: (params: {
    startDate?: string;
    endDate?: string;
    salesPersonId?: number;
  }) => void;
  isManager?: boolean;
  salesPersons?: SalesPerson[];
  isLoading?: boolean;
}

export const ReportSearchForm: React.FC<ReportSearchFormProps> = ({
  onSearch,
  isManager,
  salesPersons = [],
  isLoading,
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<
    string | undefined
  >(undefined);

  const handleSearch = () => {
    const params: {
      startDate?: string;
      endDate?: string;
      salesPersonId?: number;
    } = {};

    if (startDate) {
      params.startDate = format(startDate, 'yyyy-MM-dd');
    }
    if (endDate) {
      params.endDate = format(endDate, 'yyyy-MM-dd');
    }
    if (selectedSalesPersonId && selectedSalesPersonId !== 'all') {
      params.salesPersonId = parseInt(selectedSalesPersonId, 10);
    }

    onSearch(params);
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedSalesPersonId(undefined);
    onSearch({});
  };

  // Validate date range
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setEndDate(undefined);
    }
  }, [startDate, endDate]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* Date Range */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">시작일</Label>
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="시작일 선택"
                  maxDate={endDate || new Date()}
                />
              </div>
              <div className="hidden sm:block text-muted-foreground">~</div>
              <div className="space-y-2">
                <Label htmlFor="end-date">종료일</Label>
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="종료일 선택"
                  minDate={startDate}
                  maxDate={new Date()}
                />
              </div>
            </div>

            {/* Sales Person Selector (Only for managers) */}
            {isManager && (
              <div className="space-y-2 min-w-[200px]">
                <Label htmlFor="sales-person">영업 담당자</Label>
                <Select
                  value={selectedSalesPersonId}
                  onValueChange={setSelectedSalesPersonId}
                  disabled={isLoading || salesPersons.length === 0}
                >
                  <SelectTrigger id="sales-person">
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {salesPersons.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search Buttons */}
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                초기화
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                검색
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};