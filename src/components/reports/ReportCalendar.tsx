'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Report {
  id: number;
  report_date: string;
  sales_person: {
    name: string;
  };
  visit_count: number;
  has_comments: boolean;
}

interface ReportCalendarProps {
  initialDate?: Date;
  reports: Report[];
  onMonthChange?: (date: Date) => void;
  isLoading?: boolean;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const ReportCalendar: React.FC<ReportCalendarProps> = ({
  initialDate = new Date(),
  reports = [],
  onMonthChange,
  isLoading = false,
}) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 월 첫째 날의 요일 가져오기
  const startDayOfWeek = getDay(monthStart);

  // 캘린더 빈 셀 계산
  const emptyCells = Array(startDayOfWeek).fill(null);

  // 날짜별 일일 보고 그룹화
  const reportsByDate = React.useMemo(() => {
    const grouped: { [key: string]: Report[] } = {};
    reports.forEach(report => {
      const dateKey = format(new Date(report.report_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(report);
    });
    return grouped;
  }, [reports]);

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayReports = reportsByDate[dateStr] || [];
    
    if (dayReports.length === 1) {
      // 1건인 경우 상세 페이지로
      router.push(`/reports/${dayReports[0].id}`);
    } else if (dayReports.length > 1) {
      // 여러 건인 경우 목록 페이지로 (날짜 필터)
      router.push(`/reports?date=${dateStr}`);
    } else {
      // 0건인 경우 신규 작성 페이지로
      router.push(`/reports/new?date=${dateStr}`);
    }
  };

  const getDayContent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayReports = reportsByDate[dateStr] || [];
    
    return (
      <div className="h-full">
        <div className="text-sm font-medium mb-1">
          {format(date, 'd')}
        </div>
        {dayReports.length > 0 ? (
          <div className="space-y-1">
            {dayReports.slice(0, 2).map((report, idx) => (
              <div
                key={report.id}
                className="text-xs p-1 bg-primary/10 rounded truncate"
                title={report.sales_person.name}
              >
                {report.sales_person.name}
              </div>
            ))}
            {dayReports.length > 2 && (
              <div className="text-xs text-muted-foreground">
                외 {dayReports.length - 2}건
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            보고 없음
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-px bg-muted/50 rounded-t-lg overflow-hidden">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center py-2 text-sm font-medium",
                index === 0 && "text-red-500",
                index === 6 && "text-blue-500"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 본체 */}
        <div className="grid grid-cols-7 gap-px bg-muted/50 rounded-b-lg overflow-hidden">
          {/* 빈 셀 */}
          {emptyCells.map((_, index) => (
            <div
              key={`empty-${index}`}
              className="min-h-[80px] bg-background"
            />
          ))}

          {/* 날짜 셀 */}
          {days.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayReports = reportsByDate[dateStr] || [];
            const dayOfWeek = getDay(date);

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-[80px] p-2 bg-background cursor-pointer hover:bg-accent transition-colors",
                  isToday(date) && "bg-primary/5 ring-1 ring-primary",
                  selectedDate && isSameDay(date, selectedDate) && "bg-accent",
                  !isSameMonth(date, currentDate) && "opacity-50",
                  dayOfWeek === 0 && "text-red-500",
                  dayOfWeek === 6 && "text-blue-500"
                )}
                onClick={() => handleDateClick(date)}
              >
                {getDayContent(date)}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="mt-4 flex items-center justify-end gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/10 rounded" />
            <span>보고 있음</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/5 ring-1 ring-primary rounded" />
            <span>오늘</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};