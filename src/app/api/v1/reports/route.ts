import { NextRequest, NextResponse } from 'next/server';
import { ReportSummary } from '@/types/api';

// Mock reports data
const mockReports: ReportSummary[] = [
  {
    id: 1,
    report_date: '2025-09-04',
    sales_person: {
      id: 1,
      name: '山田太郎',
    },
    visit_count: 3,
    has_comments: true,
    created_at: '2025-09-04T09:00:00Z',
  },
  {
    id: 2,
    report_date: '2025-09-03',
    sales_person: {
      id: 1,
      name: '山田太郎',
    },
    visit_count: 5,
    has_comments: true,
    created_at: '2025-09-03T09:00:00Z',
  },
  {
    id: 3,
    report_date: '2025-09-02',
    sales_person: {
      id: 3,
      name: '佐藤花子',
    },
    visit_count: 2,
    has_comments: false,
    created_at: '2025-09-02T09:00:00Z',
  },
  {
    id: 4,
    report_date: '2025-09-01',
    sales_person: {
      id: 1,
      name: '山田太郎',
    },
    visit_count: 4,
    has_comments: true,
    created_at: '2025-09-01T09:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '20', 10);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedReports = mockReports.slice(startIndex, endIndex);
  
  return NextResponse.json({
    data: paginatedReports,
    pagination: {
      total: mockReports.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(mockReports.length / perPage),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Validate required fields
  if (!body.report_date || !body.problem || !body.plan) {
    return NextResponse.json(
      { 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: '必須項目が入力されていません',
        } 
      },
      { status: 400 }
    );
  }
  
  const newReport = {
    id: mockReports.length + 1,
    report_date: body.report_date,
    sales_person_id: 1,
    problem: body.problem,
    plan: body.plan,
    created_at: new Date().toISOString(),
  };
  
  return NextResponse.json(newReport, { status: 201 });
}