import { NextRequest, NextResponse } from 'next/server';
import { Comment } from '@/types/api';

// Mock comments data
const mockComments: Comment[] = [
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
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reportId = parseInt(id, 10);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (reportId === 1) {
    return NextResponse.json({ data: mockComments });
  }
  
  return NextResponse.json({ data: [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reportId = parseInt(id, 10);
  const body = await request.json();
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Check if user is manager (in real app, this would check JWT token)
  // For testing, we'll accept all comments
  
  if (!body.comment || body.comment.trim().length === 0) {
    return NextResponse.json(
      { 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'コメントは必須です',
          details: [{ field: 'comment', message: 'コメントを入力してください' }]
        } 
      },
      { status: 400 }
    );
  }
  
  if (body.comment.length > 500) {
    return NextResponse.json(
      { 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'コメントは500文字以内で入力してください',
          details: [{ field: 'comment', message: 'コメントが長すぎます' }]
        } 
      },
      { status: 400 }
    );
  }
  
  const newComment: Comment = {
    id: mockComments.length + 1,
    report_id: reportId,
    manager_id: 2,
    manager: {
      id: 2,
      name: '田中部長',
      email: 'tanaka@example.com',
      department: '営業1課',
      is_manager: true,
    },
    comment: body.comment,
    created_at: new Date().toISOString(),
  };
  
  mockComments.push(newComment);
  
  return NextResponse.json(newComment, { status: 201 });
}