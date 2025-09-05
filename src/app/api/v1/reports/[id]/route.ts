import { NextRequest, NextResponse } from 'next/server';
import { Report } from '@/types/api';

// Mock data for testing
const mockReport: Report = {
  id: 1,
  report_date: '2025-09-04',
  sales_person_id: 1,
  sales_person: {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    department: '営業1課',
    is_manager: false,
  },
  problem: '新規開拓の進捗が遅れている。\n競合他社の動向について情報収集が必要。\n既存顧客からの要望対応に時間がかかっている。',
  plan: 'ABC商事への見積もり作成を完了させる。\n新規リスト50件に電話アプローチを実施。\nXYZ工業への提案資料を準備。',
  visits: [
    {
      id: 1,
      report_id: 1,
      customer_id: 10,
      customer: {
        id: 10,
        company_name: 'ABC商事',
        contact_person: '佐藤一郎',
        phone: '03-1234-5678',
        email: 'sato@abc.co.jp',
        created_at: '2025-01-01T09:00:00Z',
        updated_at: '2025-01-01T09:00:00Z',
      },
      visit_content: '新商品の提案を実施。先方の反応は良好で、次回見積もり提出予定。',
      visit_time: '10:00',
      created_at: '2025-09-04T10:00:00Z',
    },
    {
      id: 2,
      report_id: 1,
      customer_id: 11,
      customer: {
        id: 11,
        company_name: 'XYZ工業',
        contact_person: '鈴木二郎',
        phone: '06-2345-6789',
        email: 'suzuki@xyz.co.jp',
        created_at: '2025-01-01T09:00:00Z',
        updated_at: '2025-01-01T09:00:00Z',
      },
      visit_content: '既存システムの保守相談。来月の更新契約について前向きな回答を得た。',
      visit_time: '14:00',
      created_at: '2025-09-04T14:00:00Z',
    },
    {
      id: 3,
      report_id: 1,
      customer_id: 12,
      customer: {
        id: 12,
        company_name: 'DEF株式会社',
        contact_person: '田中花子',
        created_at: '2025-01-01T09:00:00Z',
        updated_at: '2025-01-01T09:00:00Z',
      },
      visit_content: '新規案件のヒアリング。予算規模と導入時期を確認。',
      visit_time: '16:00',
      created_at: '2025-09-04T16:00:00Z',
    },
  ],
  comments: [
    {
      id: 1,
      report_id: 1,
      manager_id: 2,
      manager: {
        id: 2,
        name: '田中部長',
        email: 'tanaka@example.com',
        department: '営業1課',
        is_manager: true,
      },
      comment: '新規開拓については明日相談しましょう。競合情報は営業会議で共有お願いします。',
      created_at: '2025-09-04T18:00:00Z',
    },
    {
      id: 2,
      report_id: 1,
      manager_id: 2,
      manager: {
        id: 2,
        name: '田中部長',
        email: 'tanaka@example.com',
        department: '営業1課',
        is_manager: true,
      },
      comment: 'ABC商事の見積もりは優先度高めでお願いします。必要があればサポートします。',
      created_at: '2025-09-04T18:30:00Z',
    },
  ],
  created_at: '2025-09-04T09:00:00Z',
  updated_at: '2025-09-04T17:30:00Z',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (id === 1) {
    return NextResponse.json(mockReport);
  }
  
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: '日報が見つかりません' } },
    { status: 404 }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  const body = await request.json();
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (id === 1) {
    return NextResponse.json({
      ...mockReport,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }
  
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: '日報が見つかりません' } },
    { status: 404 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (id === 1) {
    return new NextResponse(null, { status: 204 });
  }
  
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: '日報が見つかりません' } },
    { status: 404 }
  );
}