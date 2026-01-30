'use client';

import { Visit } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Building2 } from 'lucide-react';

interface VisitRecordListProps {
  visits: Visit[];
  isLoading?: boolean;
}

export function VisitRecordList({ visits, isLoading }: VisitRecordListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          방문 기록
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          방문 기록
        </h3>
        <p className="text-muted-foreground">방문 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        방문 기록
      </h3>
      <div className="space-y-3">
        {visits.map((visit, index) => (
          <Card key={visit.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground mr-2">
                      {index + 1}.
                    </span>
                    <span className="font-semibold">
                      {visit.customer?.company_name || `고객ID: ${visit.customer_id}`}
                    </span>
                    {visit.customer?.contact_person && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({visit.customer.contact_person}님)
                      </span>
                    )}
                  </div>
                  {visit.visit_time && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{visit.visit_time}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap pl-6">
                  {visit.visit_content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}