import { PrismaClient, ManagerComment, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CommentWithManager extends ManagerComment {
  manager: {
    salesPersonId: number;
    name: string;
  };
}

/**
 * 日報に対するコメント一覧を取得
 * @param reportId 日報ID
 * @returns コメント一覧（管理者情報付き）
 */
export async function getCommentsByReportId(reportId: number): Promise<CommentWithManager[]> {
  try {
    const comments = await prisma.managerComment.findMany({
      where: {
        reportId: reportId,
      },
      include: {
        manager: {
          select: {
            salesPersonId: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments;
  } catch (error) {
    console.error(`Failed to get comments for report ${reportId}:`, error);
    throw new Error('コメントの取得に失敗しました');
  }
}

/**
 * 日報が存在するかチェック
 * @param reportId 日報ID
 * @returns 存在する場合true
 */
export async function checkReportExists(reportId: number): Promise<boolean> {
  try {
    const report = await prisma.dailyReport.findUnique({
      where: {
        reportId: reportId,
      },
      select: {
        reportId: true,
      },
    });

    return report !== null;
  } catch (error) {
    console.error(`Failed to check report existence for ID ${reportId}:`, error);
    return false;
  }
}

/**
 * コメントを作成
 * @param reportId 日報ID
 * @param managerId 管理者ID（コメント作成者）
 * @param comment コメント内容
 * @returns 作成されたコメント（管理者情報付き）
 */
export async function createComment(
  reportId: number,
  managerId: number,
  comment: string
): Promise<CommentWithManager> {
  try {
    // まず日報の存在を確認
    const reportExists = await checkReportExists(reportId);
    if (!reportExists) {
      throw new Error('指定された日報が見つかりません');
    }

    // コメントを作成
    const newComment = await prisma.managerComment.create({
      data: {
        reportId: reportId,
        managerId: managerId,
        comment: comment,
      },
      include: {
        manager: {
          select: {
            salesPersonId: true,
            name: true,
          },
        },
      },
    });

    return newComment;
  } catch (error) {
    console.error('Failed to create comment:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('コメントの作成に失敗しました');
  }
}

/**
 * ユーザーが管理者権限を持っているかチェック
 * @param userId ユーザーID
 * @returns 管理者の場合true
 */
export async function isManager(userId: number): Promise<boolean> {
  try {
    const user = await prisma.salesPerson.findUnique({
      where: {
        salesPersonId: userId,
      },
      select: {
        isManager: true,
      },
    });

    return user?.isManager === true;
  } catch (error) {
    console.error(`Failed to check manager status for user ${userId}:`, error);
    return false;
  }
}

/**
 * データベース接続を閉じる
 * ※ API ルートの最後で必ず呼ぶこと
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}